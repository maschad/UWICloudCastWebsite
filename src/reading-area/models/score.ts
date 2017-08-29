/**
 * Created by carlos on 5/16/17.
 */
export interface IScore {
    totalCorrect: number
    totalWrong: number
}


export class Score implements IScore {
    totalCorrect: number;
    totalWrong: number;

    constructor() {
        this.totalCorrect = 0;
        this.totalWrong = 0;
    }


    public updateScore(totalCorrect: number, totalWrong: number) {
        this.totalCorrect+= totalCorrect;
        this.totalWrong+= totalWrong;
    }
}