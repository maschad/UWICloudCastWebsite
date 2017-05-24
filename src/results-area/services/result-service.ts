/**
 * Created by carlos on 5/16/17.
 */

import {Injectable} from "@angular/core";
import {FirebaseObjectObservable, AngularFireDatabase, FirebaseListObservable} from "angularfire2";
import {IScore} from "../../reading-area/models/score";
import {AuthService} from "../../auth/services/auth-service";
import {Http, Headers, RequestOptions} from "@angular/http";
import {type} from "os";

@Injectable()
export class ResultService {
    private headers = new Headers({'Content-Type': 'application/json'});
    private options = new RequestOptions({ headers: this.headers });
    private sentencesUrl = 'api/onScreenSentences';
    private userResults: FirebaseObjectObservable<IScore>;
    private authPath = `/results/${this.auth.id}`;



    constructor(private db:AngularFireDatabase, private auth:AuthService, private http:Http){}

    getUserScoreforParagraphs(success) : void {
        let scores = [];
        this.db.object(this.authPath , { preserveSnapshot: true }).subscribe(snapshot => {
            snapshot.forEach(function (score) {
                scores.push(score.val().score.totalCorrect);
            });
            success(scores);
        });

    }

    getHighestResults() : Promise<any> {
        return this.http.get(this.sentencesUrl)
            .toPromise()
            .then(response => response.json().data)
            .catch(ResultService.handleError)

    }


    private static handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        return Promise.reject(error.message || error);
    }


}