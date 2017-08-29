import {Phoneme} from "./Phoneme";

export  class KaldiResult{
    final: boolean;
    hypotheses: Hypotheses[];

    constructor(final:boolean, hypotheses: Hypotheses[]){
        this.final = final;
        this.hypotheses = hypotheses;
    }
}

export class Hypotheses {
    transcript:string;
    phonemes: Phoneme[];
    likelihood: number;
    wordAlignment: Phoneme[];


    constructor(transcript:string, phonemes:Phoneme[], likelihood:number, wordAlignment: Phoneme[]){
        this.transcript = transcript;
        this.phonemes = phonemes;
        this.likelihood = likelihood;
        this.wordAlignment = wordAlignment;
    }

    getPhonemes(){
        return this.phonemes;
    }

}