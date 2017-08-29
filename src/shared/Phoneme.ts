export interface IPhoneme {
    phone: string,
    start:number,
    length:number,
    confidence:number
}

export class Phoneme implements IPhoneme{
    phone: string;
    start: number;
    length: number;
    confidence: number;

    constructor(label: string, start: number, length: number, confidence: number) {
        this.phone = label;
        this.start = start;
        this.length = length;
        this.confidence = confidence;
    }

    getPhone() {
        return this.phone;
    }

    getConfidence(){
        return this.confidence;
    }

}