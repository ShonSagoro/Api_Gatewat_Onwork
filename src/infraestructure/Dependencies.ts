import { UserSagaImpl } from "./services/UserSagaImpl";

export async function AuthTokenBanned() {
    const userSagaImpl = new UserSagaImpl();
    await userSagaImpl.receiveToken();    
}