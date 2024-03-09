import Amqp from "amqplib/callback_api"

export * from './type'

export default class EventConnector {
  private readonly host;
  private readonly exchange;
  private readonly domain;
  private channel: Amqp.Channel | null = null;

  constructor(host: string, exchange: string, domain: string) {
    this.host = host;
    this.exchange = exchange;
    this.domain = domain;
  }
  
  public run(callback: (msg: Amqp.Message | null) => void) {
    return new Promise<void>((resolve, reject) => {
      Amqp.connect(this.host, (err, connection) => {
        if (err) {
          reject(err)
          return;
        }

        connection.createChannel((err, channel) => {
          if (err) {
            reject(err)
            return;
          }

          this.channel = channel;
          channel.assertExchange(this.exchange, 'direct', {
            durable: false
          });
      
          channel.assertQueue('', {
            exclusive: true
          }, (err, q) => {
            if (err) {
              reject(err)
              return;
            }
            
            channel.bindQueue(q.queue, this.exchange, this.domain);
            channel.consume(q.queue, callback, { noAck: true });
            resolve();
          });
        });
      });
    });
  }

  public broadcastMessage(domain: string, method: string | any, data?: any) {
    if (!this.channel) return;
    this.channel.publish(this.exchange, domain, Buffer.from(JSON.stringify({ method, data })));
  }
}