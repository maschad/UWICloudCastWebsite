
/**
 * Created by carlos on 3/15/17.
 */
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';


import {EventEmitter, Injectable} from '@angular/core';
import {AngularFireDatabase, FirebaseObjectObservable} from "angularfire2";
import {AuthService} from "../../auth/services/auth-service";
import {Http, Response, Headers, RequestOptions} from "@angular/http";
import {onScreenSentence} from "../models/onScreenSentence";
import {Score, IScore} from "../models/score";
import {IUser, User} from "../../shared/User";
import {KaldiResponse} from "../../shared/kaldiResponse";
import {SCORE} from "../components/UserActions";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {Observable} from "rxjs/Observable";
import {KaldiResult} from "../../shared/kaldiResult";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

declare const CloudCAST:any;

@Injectable()
export class ReadingService {

    //JSON Headers and Options for HTTP requests
    private headers = new Headers({'Content-Type': 'application/json'});
    private options = new RequestOptions({ headers: this.headers });
    //In Memory API #TODO: Change when using actual server
    private sentencesUrl = 'api/onScreenSentences';
    private cloudCASTUrl = 'https://this.cloudcast.sheffield.ac.uk/api/v0';
    private kaldiReponse: KaldiResponse;
    //Recording behaviour subject
    private isRecording: BehaviorSubject<boolean> = new BehaviorSubject(false);
    //Observable recording stream
    public isRecording$: Observable<boolean>;
    private cloudcast: any;

    //Firebase Variables
    private results$: FirebaseObjectObservable<IScore>;
    private users$: FirebaseObjectObservable<IUser>;
    private score$: FirebaseObjectObservable<IScore>;
    private userPath = `/users/${this.auth.id}`;
    private resultsPath = `/results/${this.auth.id}`;
    private weakWordsPath = `/weakwords/${this.auth.id}`;




    constructor(private db: AngularFireDatabase, private auth: AuthService, private http: Http){
        //Initialize Cloud cast Object
        this.cloudcast = new CloudCAST({
            recorderWorkerPath: '../../shared/recorderWorker.js',
            username: 'foo',
            application: 'bar',
            onReady: function() {
                cloudcast.startListening();
                self.updateRecording(true);
            },
            onPartialResult: function (result) {
                console.log('partial result', result);
            },
            onResult: function(result) {
                if(result.length > 1){
                    // cloudcast.updateConfidenceScores(result[0]);
                    self.updateRecording(false);
                    console.log('result', result);
                }
            },
            onError: function(code, data) {
                console.log('Error %s: %s', code, data);
                self.updateRecording(false);
                cloudcast.cancel();
            },
            onEvent: function(code, data) {
                if(code == 11){
                    self.updateRecording(false);
                }
                console.log('code ' , code, ' data ', data);
            }
        });
        this.cloudcast.decoder('tedlium');
        this.cloudcast.init();
        let cloudcast = this.cloudcast;
        let self = this;
        this.isRecording$ = this.isRecording.asObservable();
    }

    /**
     * Load the user profile for various displays in front end
     * @returns {FirebaseObjectObservable<IUser>}
     */
    loadUserProfile(): FirebaseObjectObservable<IUser> {

        //#TODO: Clean up callback hell
        //if this is a first time user, we create a this.cloudcast and firebase account
        this.db.object(this.userPath).subscribe(
                user => {
                    //If it's a first time user
                    if(user.userData == undefined){
                        this.createCloudUser().then(
                            response => {
                                if(response){
                                    console.log('User successfully created on cloudCAST');
                                    this.db.object(this.userPath).set({
                                        userData :new User(this.auth.id)
                                    });
                                } else{
                                    console.log('User failed to create on cloudcast');
                                }
                            }
                        )

                    }

                }
            );

        return this.db.object(this.userPath);
    }


    /**
     *Load the paragraph to be read
     * @param lastReadParagraphId
     * @returns {Promise<onScreenSentence>}
     */

    getLastReadParagraph(lastReadParagraphId:number): Promise<onScreenSentence> {
        return this.http.get(this.sentencesUrl + '/' + lastReadParagraphId)
            .toPromise()
            .then(response => response.json().data as onScreenSentence)
            .catch(ReadingService.handleError);
    }

    /**
     * When a reader has finished a paragraph, we want to store that score in firebase
     * @param newScore
     * @param id
     */
    updateScore(newScore: Score): void {
        //#TODO: Eventually stop updating results and update users only
        this.results$ = this.db.object(this.resultsPath + `/${this.auth.id}`);
        this.results$.set({ score:newScore });

        this.score$ = this.getIndex(SCORE);
        this.score$.set({score:Score});
    }

    /**
     * Once that score has been completed we want to set it if it's the high score
     * @param score
     * @param id
     */
    setHighestScore(score:number, id:number): void{
        this.http.post(this.sentencesUrl + '/' + id, {highestScore:score}, this.options)
            .toPromise()
            .catch(ReadingService.handleError)
    }

    /**
     * Retrieve a score for a current score
     * @param id
     * @returns {FirebaseObjectObservable<any>}
     */
    retrieveScore(id:number): FirebaseObjectObservable<IScore> {
        return this.db.object(this.resultsPath + `/${id}`);
    }

    /**
     * Begin streaming audio to kaldi server
     */
    startListening() {
        this.cloudcast.open();
        this.updateRecording(true);
    }

    /**
     * End streaming audio to kaldi server
     */
    stopListening() {
       this.cloudcast.close();
        this.updateRecording(false);

    }



    /**
     * Store the words the user is weak in
     * @param words
     */
    saveWeakWords(words: string[]){
        let saveWeakWords = this.db.object(this.weakWordsPath);
        saveWeakWords.set(words);
    }

    //#TODO: Actually handle errors correctly
    private static handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        return Promise.reject(error.message || error);
    }

    /**
     * Retrieve an index in the user path
     * @param {string} type
     * @returns {FirebaseObjectObservable<number>}
     */
    getIndex(type:string): FirebaseObjectObservable<any>{
        return this.db.object(this.userPath + `/userData/${type}`);
    }

    /**
     * Return the current user
     */
    loadUser(): firebase.User {
        return this.auth.getUser();
    }

    /**
     * Create cloudCAST User
     */
    createCloudUser(): Promise<boolean> {
        let accountInfo = {
            "name": this.auth.getUser().displayName,
            "email_address": this.auth.getUser().email
        };
        return this.http.post(this.cloudCASTUrl + '/users', {accountInfo}, this.options)
            .toPromise()
            .then(response => response.status == 201);
    }

    /**
     * get CloudCAST User id
     */
    getCloudCASTUserId(): Promise<number> {
        return this.http.get(this.cloudCASTUrl + '/user')
            .toPromise()
            .then(response => response.json().data.uid)
    }

    /**
     * send confidence scores
     */
    getConfidence(result:KaldiResult){
        return
    }

    /**
     * Update the recording observable
     */
    updateRecording(value:boolean): void {
        this.isRecording.next(value);
    }


}