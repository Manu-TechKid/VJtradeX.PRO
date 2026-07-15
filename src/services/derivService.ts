// Deriv WebSocket Service

export interface Tick {
  symbol: string;
  quote: number;
  epoch: number;
  lastDigit: number;
  change: 'up' | 'down' | 'flat';
}

export interface AccountInfo {
  email: string;
  balance: number;
  currency: string;
  fullname: string;
  loginid: string;
  isVirtual: boolean;
}

export interface TradeResult {
  contractId: number;
  purchasePrice: number;
  sellPrice?: number;
  profit: number;
  status: 'won' | 'lost' | 'pending';
  contractType: string;
  symbol: string;
  barrier?: number;
  entryTick?: number;
  exitTick?: number;
  barrierText?: string;
}

type MessageCallback = (data: any) => void;
type TickCallback = (tick: Tick) => void;

class DerivService {
  private ws: WebSocket | null = null;
  private appId: string = '1089'; // Default demo App ID
  private token: string = '';
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private messageCallbacks: Map<string, MessageCallback[]> = new Map();
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();
  private reqIdCounter: number = 1;
  private tickCallbacks: Map<string, Set<TickCallback>> = new Map();
  private activeTickSubscriptions: Map<string, string> = new Map(); // symbol -> subscriptionId
  private onConnectionChangeCallbacks: Set<(connected: boolean) => void> = new Set();
  private onAccountInfoCallbacks: Set<(info: AccountInfo | null) => void> = new Set();
  private accountInfo: AccountInfo | null = null;
  private lastTicks: Map<string, Tick> = new Map();

  constructor() {
    // Attempt to auto-initialize if a token is in localStorage
    const savedToken = localStorage.getItem('deriv_api_token');
    const savedAppId = localStorage.getItem('deriv_app_id');
    if (savedAppId) this.appId = savedAppId;
    if (savedToken) {
      this.token = savedToken;
    }
  }

  public setAppId(appId: string) {
    if (this.appId !== appId) {
      this.appId = appId;
      localStorage.setItem('deriv_app_id', appId);
      this.disconnect();
    }
  }

  public getAppId(): string {
    return this.appId;
  }

  public getToken(): string {
    return this.token;
  }

  public getAccountInfo(): AccountInfo | null {
    return this.accountInfo;
  }

  public registerOnConnectionChange(cb: (connected: boolean) => void) {
    this.onConnectionChangeCallbacks.add(cb);
    cb(this.isConnected);
    return () => this.onConnectionChangeCallbacks.delete(cb);
  }

  public registerOnAccountInfo(cb: (info: AccountInfo | null) => void) {
    this.onAccountInfoCallbacks.add(cb);
    cb(this.accountInfo);
    return () => this.onAccountInfoCallbacks.delete(cb);
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected) return true;
    if (this.isConnecting) {
      return new Promise((resolve) => {
        const check = () => {
          if (this.isConnected) resolve(true);
          else if (!this.isConnecting) resolve(false);
          else setTimeout(check, 100);
        };
        check();
      });
    }

    this.isConnecting = true;
    const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`;

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.isConnecting = false;
          this.notifyConnectionChange(true);
          // If we have a stored token, authenticate automatically
          if (this.token) {
            this.authorize(this.token).catch((err) => {
              console.error('Auto authorization failed:', err);
              this.logout();
            });
          }
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket Error:', error);
          this.isConnecting = false;
          resolve(false);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.isConnecting = false;
          this.notifyConnectionChange(false);
          this.notifyAccountInfo(null);
          // Try to reconnect if appropriate
          setTimeout(() => {
            if (this.token && !this.isConnected && !this.isConnecting) {
              this.connect();
            }
          }, 5000);
        };
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  public disconnect() {
    this.token = '';
    this.accountInfo = null;
    this.notifyAccountInfo(null);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public logout() {
    localStorage.removeItem('deriv_api_token');
    this.disconnect();
  }

  public async authorize(token: string): Promise<AccountInfo> {
    await this.connect();
    const reqId = this.generateReqId();
    const request = {
      authorize: token,
      req_id: reqId,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(reqId, {
        resolve: (data: any) => {
          if (data.error) {
            reject(new Error(data.error.message));
            return;
          }
          const auth = data.authorize;
          const info: AccountInfo = {
            email: auth.email,
            balance: parseFloat(auth.balance),
            currency: auth.currency,
            fullname: auth.fullname || auth.email.split('@')[0],
            loginid: auth.loginid,
            isVirtual: !!auth.is_virtual,
          };
          this.token = token;
          this.accountInfo = info;
          localStorage.setItem('deriv_api_token', token);
          this.notifyAccountInfo(info);
          resolve(info);
        },
        reject,
      });

      this.send(request);
    });
  }

  public async getTicksHistory(symbol: string, count: number = 100): Promise<Tick[]> {
    await this.connect();
    const reqId = this.generateReqId();
    const request = {
      ticks_history: symbol,
      end: 'latest',
      style: 'ticks',
      count: count,
      req_id: reqId,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(reqId, {
        resolve: (data: any) => {
          if (data.error) {
            reject(new Error(data.error.message));
            return;
          }
          const history = data.history;
          if (!history || !history.prices) {
            resolve([]);
            return;
          }

          const ticks: Tick[] = [];
          for (let i = 0; i < history.prices.length; i++) {
            const price = history.prices[i];
            const epoch = history.times[i];
            const priceStr = price.toFixed(data.echo_req.subscribe ? 2 : 4);
            const lastDigit = parseInt(priceStr[priceStr.length - 1]);

            let change: 'up' | 'down' | 'flat' = 'flat';
            if (i > 0) {
              change = price > history.prices[i - 1] ? 'up' : (price < history.prices[i - 1] ? 'down' : 'flat');
            }

            ticks.push({
              symbol,
              quote: price,
              epoch,
              lastDigit: isNaN(lastDigit) ? 0 : lastDigit,
              change,
            });
          }
          resolve(ticks);
        },
        reject,
      });

      this.send(request);
    });
  }

  public subscribeTicks(symbol: string, callback: TickCallback): () => void {
    this.connect();

    if (!this.tickCallbacks.has(symbol)) {
      this.tickCallbacks.set(symbol, new Set());
    }
    this.tickCallbacks.get(symbol)!.add(callback);

    // If there is already a subscription request running or complete, don't re-subscribe
    if (!this.activeTickSubscriptions.has(symbol)) {
      this.activeTickSubscriptions.set(symbol, 'pending');
      const reqId = this.generateReqId();
      const request = {
        ticks: symbol,
        subscribe: 1,
        req_id: reqId,
      };

      this.send(request);
    } else {
      // Send the last tick immediately if we have it
      const lastTick = this.lastTicks.get(symbol);
      if (lastTick) {
        callback(lastTick);
      }
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.tickCallbacks.get(symbol);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.tickCallbacks.delete(symbol);
          const subId = this.activeTickSubscriptions.get(symbol);
          if (subId && subId !== 'pending') {
            this.send({ forget: subId });
          }
          this.activeTickSubscriptions.delete(symbol);
          this.lastTicks.delete(symbol);
        }
      }
    };
  }

  public async executeTrade(params: {
    symbol: string;
    contractType: string;
    amount: number;
    duration: number;
    durationUnit: 't' | 's' | 'm' | 'h';
    barrier?: number;
    onUpdate?: (result: TradeResult) => void;
  }): Promise<TradeResult> {
    if (!this.token) {
      throw new Error('Please login with your Deriv API Token first.');
    }
    await this.connect();

    // Step 1: Request a proposal
    const proposalReqId = this.generateReqId();
    const proposalReq: any = {
      proposal: 1,
      amount: params.amount,
      basis: 'stake',
      contract_type: params.contractType,
      currency: this.accountInfo?.currency || 'USD',
      duration: params.duration,
      duration_unit: params.durationUnit,
      symbol: params.symbol,
      req_id: proposalReqId,
    };

    if (params.barrier !== undefined) {
      proposalReq.barrier = String(params.barrier);
    }

    const proposalData = await new Promise<any>((resolve, reject) => {
      this.pendingRequests.set(proposalReqId, {
        resolve: (data: any) => {
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.proposal);
        },
        reject,
      });
      this.send(proposalReq);
    });

    const proposalId = proposalData.id;

    // Step 2: Buy the contract
    const buyReqId = this.generateReqId();
    const buyReq = {
      buy: proposalId,
      price: params.amount,
      req_id: buyReqId,
    };

    const buyData = await new Promise<any>((resolve, reject) => {
      this.pendingRequests.set(buyReqId, {
        resolve: (data: any) => {
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.buy);
        },
        reject,
      });
      this.send(buyReq);
    });

    const contractId = buyData.contract_id;

    // Set initial trade result object
    let tradeResult: TradeResult = {
      contractId,
      purchasePrice: params.amount,
      profit: 0,
      status: 'pending',
      contractType: params.contractType,
      symbol: params.symbol,
      barrier: params.barrier,
    };

    if (params.onUpdate) {
      params.onUpdate(tradeResult);
    }

    // Step 3: Monitor contract status
    const pocReqId = this.generateReqId();
    const pocReq = {
      proposal_open_contract: 1,
      contract_id: contractId,
      subscribe: 1,
      req_id: pocReqId,
    };

    return new Promise<TradeResult>((resolve, reject) => {
      // We will listen to incoming updates for this contract ID
      const cleanup = () => {
        this.send({ forget: pocReqId }).catch(() => {});
        this.messageCallbacks.delete(`poc_${contractId}`);
      };

      const callbacks = this.messageCallbacks.get(`poc_${contractId}`) || [];
      callbacks.push((data: any) => {
        const poc = data.proposal_open_contract;
        if (!poc) return;

        const isSold = poc.is_sold === 1;
        const status = isSold ? (poc.status === 'won' ? 'won' : 'lost') : 'pending';
        const profit = parseFloat(poc.profit);

        tradeResult = {
          contractId,
          purchasePrice: parseFloat(poc.buy_price || params.amount),
          sellPrice: isSold ? parseFloat(poc.sell_price) : undefined,
          profit,
          status,
          contractType: params.contractType,
          symbol: params.symbol,
          barrier: params.barrier,
          entryTick: poc.entry_tick,
          exitTick: poc.exit_tick,
          barrierText: poc.barrier,
        };

        if (params.onUpdate) {
          params.onUpdate(tradeResult);
        }

        // Update balance if trade completes
        if (isSold) {
          if (this.accountInfo) {
            // Fetch updated balance from authorization info or simply query it
            // We'll update our local accountInfo balance representation
            this.updateBalance().catch(console.error);
          }
          cleanup();
          resolve(tradeResult);
        }
      });
      this.messageCallbacks.set(`poc_${contractId}`, callbacks);

      this.send(pocReq).catch((err) => {
        cleanup();
        reject(err);
      });
    });
  }

  private async updateBalance(): Promise<void> {
    if (!this.token) return;
    const reqId = this.generateReqId();
    const request = {
      authorize: this.token,
      req_id: reqId,
    };
    return new Promise((resolve) => {
      this.pendingRequests.set(reqId, {
        resolve: (data: any) => {
          if (!data.error && data.authorize && this.accountInfo) {
            this.accountInfo.balance = parseFloat(data.authorize.balance);
            this.notifyAccountInfo({ ...this.accountInfo });
          }
          resolve();
        },
        reject: () => resolve(),
      });
      this.send(request);
    });
  }

  private handleIncomingMessage(data: any) {
    const msgType = data.msg_type;
    const reqId = data.req_id;

    // 1. Resolve pending request promises
    if (reqId && this.pendingRequests.has(reqId)) {
      const { resolve } = this.pendingRequests.get(reqId)!;
      this.pendingRequests.delete(reqId);
      resolve(data);
    }

    // 2. Handle tick stream
    if (msgType === 'tick' && data.tick) {
      const tickData = data.tick;
      const symbol = tickData.symbol;
      const quote = tickData.quote;
      const epoch = tickData.epoch;
      const subId = tickData.id;

      if (symbol && this.activeTickSubscriptions.has(symbol)) {
        if (this.activeTickSubscriptions.get(symbol) === 'pending') {
          this.activeTickSubscriptions.set(symbol, subId);
        }

        // Calculate digit
        const priceStr = quote.toFixed(tickData.pip_size || 2);
        const lastDigit = parseInt(priceStr[priceStr.length - 1]);

        const previousTick = this.lastTicks.get(symbol);
        const change = previousTick
          ? (quote > previousTick.quote ? 'up' : (quote < previousTick.quote ? 'down' : 'flat'))
          : 'flat';

        const tickObj: Tick = {
          symbol,
          quote,
          epoch,
          lastDigit: isNaN(lastDigit) ? 0 : lastDigit,
          change,
        };

        this.lastTicks.set(symbol, tickObj);

        // Fire callbacks
        const callbacks = this.tickCallbacks.get(symbol);
        if (callbacks) {
          callbacks.forEach((cb) => {
            try {
              cb(tickObj);
            } catch (err) {
              console.error('Error in tick callback:', err);
            }
          });
        }
      }
    }

    // 3. Handle proposal open contract
    if (msgType === 'proposal_open_contract' && data.proposal_open_contract) {
      const poc = data.proposal_open_contract;
      const contractId = poc.contract_id;
      const callbacks = this.messageCallbacks.get(`poc_${contractId}`);
      if (callbacks) {
        callbacks.forEach((cb) => cb(data));
      }
    }
  }

  private async send(request: any): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(request));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  private generateReqId(): number {
    return this.reqIdCounter++;
  }

  private notifyConnectionChange(connected: boolean) {
    this.onConnectionChangeCallbacks.forEach((cb) => cb(connected));
  }

  private notifyAccountInfo(info: AccountInfo | null) {
    this.onAccountInfoCallbacks.forEach((cb) => cb(info));
  }
}

export const derivService = new DerivService();
