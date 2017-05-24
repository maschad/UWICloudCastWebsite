/**
 * Created by carlos on 5/7/17.
 */

import {Injectable} from "@angular/core";
import {FirebaseListObservable, AngularFireDatabase, FirebaseObjectObservable} from "angularfire2";
import {AuthService} from "../../auth/services/auth-service";
import {Http, Headers, RequestOptions} from "@angular/http";


@Injectable()
export class PracticeService  {
    private headers = new Headers({'Content-Type': 'application/json'});
    private options = new RequestOptions({ headers: this.headers });
    private dictionaryUrl = '../../common/dictionary.txt';
    private path = `/weakwords/${this.auth.id}`;


    constructor(private db: AngularFireDatabase, private auth: AuthService, private http: Http) {}


    getPracticeWords(success): void {
        let weakwords = [];
         this.db.object(this.path, {preserveSnapshot: true }).subscribe(snapshot => {
             snapshot.forEach(function (word) {
                 weakwords.push(word.val());
             });
             success(weakwords);
         });
    }

    searchDictionary() {

    }
}