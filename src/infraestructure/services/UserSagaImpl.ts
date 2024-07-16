import { IUserSaga } from "../../domain/IUserSaga";
import JWTMiddleware from "../../middleware/JWTMiddleware";
import { setupRabbitMQ } from "../config/RabbitConfig";
import {Signale} from "signale";


export class UserSagaImpl implements IUserSaga {
    private queueName: string = process.env.RABBIT_QUEUE_USER_TOKEN || 'default';
    private exchangeName: string = process.env.RABBIT_EXCHANGE_USER || 'default';
    private routingKey: string = process.env.RABBIT_ROUTING_KEY_USER_TOKEN || 'default';


    async receiveToken(): Promise<void> {
        const signale = new Signale();
        try {
            const channel = await setupRabbitMQ(this.queueName, this.exchangeName, this.routingKey);
            channel.consume(this.queueName, (msg) => {
                if (msg) {
                    signale.info('Message received:', msg.content.toString());
                    const content:any = JSON.parse(msg.content.toString());
                    signale.info('Message received:', content);
                    
                    JWTMiddleware.addToBlacklist(content.token);
                    
                    signale.success('Token added to blacklist');                 
                    channel.ack(msg);
                }
            });
        } catch (error) {
            signale.error('Error:', error);
        }

    }
}