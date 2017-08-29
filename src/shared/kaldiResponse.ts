import {KaldiResult} from "./kaldiResult";

export class KaldiResponse {
    status: number;
    result: KaldiResult;
    segmentStart: number;
    segmentLength: number;
    totalLength: number;

    constructor(status:number,result: KaldiResult, segmentStart:number,segmentLength:number,totalLength:number){
        this.status = status;
        this.result = result;
        this.segmentLength = segmentLength;
        this.segmentStart = segmentStart;
        this.totalLength = totalLength;
    }

}