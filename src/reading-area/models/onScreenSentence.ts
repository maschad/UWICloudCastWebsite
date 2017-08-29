/**
 * Created by carlos on 4/18/17.
 */

export class onScreenSentence {

    private id: number;
    public text: string;
    private highestScore: number;

    constructor(id:number, text:string){
        this.id = id;
        this.text = text;
        this.highestScore = 0;

    }

    setText(text: string) : void {
        this.text = text;
    }

    get Text(): string {
        return this.text;
    }

    getCurrentId() : number {
        return this.id;
    }

    setCurrentId(id: number) : void {
        this.id = id;
    }

    incrementId() : void {
        this.id++;
    }

    setHighestScore(score:number){
        if(score > this.highestScore){
            this.highestScore = score;
        }
    }

}