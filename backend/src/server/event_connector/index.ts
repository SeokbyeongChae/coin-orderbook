import amqp from "amqplib";
import { ConnectorStatus } from './type';

export * from './type';

export default class EventConnector {
  private readonly host;
  private readonly exchange;
  private readonly domain;
  private channel: amqp.Channel | null = null;
  private connection: amqp.Connection | null = null;
  private callback: Function | null = null;

  private status = ConnectorStatus.Idle;

  constructor(host: string, exchange: string, domain: string) {
    this.host = host;
    this.exchange = exchange;
    this.domain = domain;
  }

  public async run(callback: (msg: amqp.Message | null) => void) {
    console.log('Try to connect rabbitmq server..');
    this.status = ConnectorStatus.Connecting;
    this.callback = callback;
    this.connection = await amqp.connect(this.host);
    this.connection.on("close", this.recovery.bind(this));
    this.status = ConnectorStatus.Connected;
    console.log('connected rabbitmq server..');
    

    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, "direct", { durable: false });
    
    const assertQueue = await this.channel.assertQueue("", { exclusive: true });
    this.channel.bindQueue(assertQueue.queue, this.exchange, this.domain);
    this.channel.consume(assertQueue.queue, callback, { noAck: true });
  }

  public broadcastMessage(domain: string, method: string | any, data?: any) {
    if (this.status !== ConnectorStatus.Connected || !this.channel) return;

    try {
      this.channel.publish(this.exchange, domain, Buffer.from(JSON.stringify({ method, data })));
    } catch (err) {
      console.error(err);
    }
  }

  public close() {
    if (this.status !== ConnectorStatus.Connected) return;

    this.status = ConnectorStatus.Idle;
    this.connection?.close();
  }

  private recovery() {
    console.log('Initiating connection recovery logic..');
    if (this.status !== ConnectorStatus.Connected) return;    
    this.status = ConnectorStatus.Disconnected;

    const handler = setInterval(async () => {
      if (this.status !== ConnectorStatus.Disconnected) return;

      try {
        await this.run(this.callback as any);
        clearInterval(handler);
      } catch (err) {
        console.log('Failed to connect rabbitmq server..');
        this.status = ConnectorStatus.Disconnected;
      }
    }, 3000); // TODO: config
  }
}