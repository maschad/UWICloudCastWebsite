
export interface IWord {
    title: string,
    color : string,
    completed: boolean
}

export class Word implements IWord {
    title: string;
    completed: boolean = false;
    color: string = 'white';

    constructor(title:string){
        this.title = title;
    }

    changeColor(color: string): void {
        this.color = color;
    }

    completeWord() : void {
        this.completed = true;
    }
}