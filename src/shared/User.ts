import {IScore, Score} from "../reading-area/models/score";
import {Word} from "./Word";
import {Phoneme} from "./Phoneme";

export interface IUser {
    id:string,
    lastReadParagraphId: number,
    score : IScore,
    weakPhones: Phoneme[]
}

export class User implements IUser {
    id: string;
    lastReadParagraphId: number;
    score: IScore;
    weakPhones: Phoneme[];

    constructor(id:string){
        this.id = id;
        this.lastReadParagraphId = 1;
        this.score = new Score();
        this.weakPhones = [];
    }

    updateScore(score: Score){
        this.score = score;
    }

    updateWeakPhones(weakPhones:Phoneme[]){
        this.weakPhones = weakPhones;
    }

    getLastReadParagraphId(): number {
        return this.lastReadParagraphId;
    }

}