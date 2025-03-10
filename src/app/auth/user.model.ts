export class User {
    constructor(public id: string,
        public email: string,
        private _token: string,
        private tokenExpirationDate: Date){};

    get token(){
        if(!this.tokenExpirationDate || this.tokenExpirationDate <= new Date()){
            console.log('No token')
            return null;
        }
        return this._token;
    }

    get tokenDuration(){
        if(!this.token){
            return 0;
        }
        //return 5000;
        return this.tokenExpirationDate.getTime() - new Date().getTime();
    }
}