/**
 * Created by carlos on 5/7/17.
 */


import {Component, OnInit} from "@angular/core";
import {PracticeService} from "../services/practice-service";
import {Word} from "../../reading-area/models/word";

@Component({
    selector: 'practice-area',
    styles : [
        require('./practice-area.scss')
    ],
    template: require('./practice-area.html')
})

export class PracticeAreaComponent implements OnInit{
    private practiceWords:Word[];
    private weakWords: any;

    ngOnInit(): void {
        let component = this;
        this.practiceService.getPracticeWords(function (words) {
            component.weakWords = words;
            component.addWords();
        });
    }

    constructor(private practiceService:PracticeService) {}

    addWords() : void {
        this.practiceWords = [];
        for(let title of this.weakWords){
            this.practiceWords.push(new Word(title));
        }
    }

}