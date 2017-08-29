export  class  PhonemeVM {
    confidence: number;
    title: string;

    constructor(title:string){
        this.confidence = 0;
        this.title = title;
    }

    updateTitle(title:string) {
        this.title = title;
    }

    updateConfidence(confidence: number): void {
        this.confidence = confidence;
    }
}