

import {PhonemeVM} from "./phonemeVM";

export interface IWord {
    title: string
    phonemes:PhonemeVM[],
    completed: boolean,
    color: string
}

export class WordVM implements IWord {
     phonemes: PhonemeVM[];
     title: string;
     completed: boolean = false;
     color: string = 'white';

    constructor(title:string, phonemes:PhonemeVM[]){
        this.title = title;
        this.phonemes = phonemes;
    }


    completeWord() : void {
        this.completed = true;
    }

    getPhonemes() : PhonemeVM[] {
        return this.phonemes;
    }

    setPhonemes(phonemes: PhonemeVM[]) : void {
        this.phonemes = phonemes;
    }

    setColor(): void {
        let count = 0;
        this.phonemes.forEach(phoneme => {
            if(phoneme.confidence > 0.7){
                count++
            }
        });
        if(count > this.phonemes.length){
            this.color = 'green';
        }else {
            this.color = 'red';
        }
    }
}