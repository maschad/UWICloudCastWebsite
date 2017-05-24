/**
 * Created by carlos on 3/24/17.
 */

import {Component, OnInit} from "@angular/core";
import {ReadingService} from "../services/reading-service";
import {onScreenSentence} from "../models/onScreenSentence";
import {Word} from "../models/word";
import {Score} from "../models/score";
const {webkitSpeechRecognition} = (window as any);

//for avatar speech
declare let responsiveVoice: any;

@Component({
    selector: 'reading-area',
    styles : [
        require('./reading-area.scss'),
        require('../../common/anim.scss')
    ],
    template: require('./reading-area.html')
})


export class ReadingAreaComponent implements OnInit{
    private words: Word[];
    private erroneousIndices: number[];
    private paragraph: onScreenSentence;
    private buttonText: string;
    private buttonColor: string;
    private score: Score;
    private currentScore: any;
    private all_words: string;
    private bubble= false;
    private addOn="You are to say:   ";

    
    constructor(private readingService: ReadingService){
        this.paragraph = new onScreenSentence(1, '');
        this.buttonText ='Start';
        this.buttonColor = '#4279BD';
        this.words = [];
        this.erroneousIndices = [];
        this.score = new Score();
    };


    speak(mystring: string): void {
        console.log('speak getting called');
        if(!this.bubble)
        {
            this.bubble=true;
            responsiveVoice.speak(this.addOn+mystring,'US English Female',{pitch: 1.32});
        }
        else
        {
            this.bubble=false;
        }
    }



    ngOnInit(): void {
        this.currentScore = this.readingService.retrieveScore(this.paragraph.id);
        this.getOnScreenParagraph();
    }


    getOnScreenParagraph() : void {
        this.readingService.getOnScreenParagraph(this.paragraph.getCurrentId()).then(paragraph =>
        {
            this.paragraph.setText(paragraph.text);
            this.addWords();
        });
    }

    resetState(): void {
        this.buttonText ='Start';
        this.buttonColor = '#4279BD';
        this.erroneousIndices = [];
        this.score = new Score();
    }

    record() : void {
        switch (this.buttonText){
            case 'Start':
                this.startConverting();
                break;

            case 'Try again?':
                this.resetState();
                this.startConverting();
                break;

            case 'Well done!':
                this.paragraph.incrementId();
                this.score = new Score();
                this.erroneousIndices = [];
                this.currentScore = this.readingService.retrieveScore(this.paragraph.id);
                this.getOnScreenParagraph();
                this.startConverting();
                break;
        }
    }

    addWords() : void {
        let titles = this.paragraph.text.split(' ');
        this.words = [];
        for(let title of titles){
            this.words.push(new Word(title));
        }
      
        this.all_words=this.paragraph.text;
    }

    updateWords(): void {
        console.log('updating words');
        let totalCorrect = 0;
        let totalWrong = 0;
        let incorrectWords = [];

        for(let index in this.words){
            if(this.erroneousIndices.includes(+index)){
                this.words[index].changeColor('red');
                totalWrong++;
                incorrectWords.push(this.words[+index].title);
            }else {
                totalCorrect++;
                this.words[index].changeColor('green');
            }
        }
        if(this.erroneousIndices.length == 0){
            this.buttonText = 'Well done!';
            this.buttonColor = '#63b648';
        } else {
            this.buttonText = 'Try again?';
            this.buttonColor = '#d4ad25';
        }
        this.readingService.saveWeakWords(incorrectWords);
        this.score.updateScore(totalCorrect,totalWrong);
        this.paragraph.setHighestScore(this.score.totalCorrect);
        this.readingService.setHighestScore(this.paragraph.highestScore,this.paragraph.id);
        this.readingService.saveScore(this.score, this.paragraph.id);
    }

    startConverting() {
        this.buttonText = 'Recording';
        this.buttonColor = '#ba3e4e';
        this.buttonColor = '#4279BD';
        
        let finalTranscripts = '';
        let component = this;
        if ('webkitSpeechRecognition' in window) {
            let speechRecognizer = new webkitSpeechRecognition();
            speechRecognizer.continuous = false;
            speechRecognizer.interimResults = false;
            speechRecognizer.lang = 'en-GB';
            speechRecognizer.start();
            speechRecognizer.onresult = function (event) {
                let interimTranscripts = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    let transcript = event.results[i][0].transcript;
                    transcript.replace("\n", "<br>");
                    if (event.results[i].isFinal) {
                        finalTranscripts += transcript;
                    } else {
                        interimTranscripts += transcript;
                    }

                }
                component.compareTranscript(finalTranscripts);

            };

            speechRecognizer.onerror = function (event) {
                console.log('error')
            };
        } else {
            console.log('Your browser is not supported. If google chrome, please upgrade!');
        }

    }



    compareTranscript (transcript: string) : void {
        let text = this.paragraph.text.split(' ');
        let splitTranscript = transcript.split(' ');

        for(let index in splitTranscript) {
            if(text[index].toLowerCase() != splitTranscript[index].toLowerCase()){
                this.erroneousIndices.push(+index);
            }
        }
        console.log('erroneous words', this.erroneousIndices);
        this.updateWords();
    }



}