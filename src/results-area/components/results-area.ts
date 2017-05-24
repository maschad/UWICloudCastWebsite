/**
 * Created by carlos on 5/7/17.
 */

import {Component, OnInit} from "@angular/core";
import {ResultService} from "../services/result-service";

@Component({
    selector: 'results',
    template: require('./results-area.html') ,
    styles: [
        require('./results-area.scss')
    ]
})

export class ResultsAreaComponent implements OnInit{
    public barChartOptions:any = {
        scaleShowVerticalLines: false,
        responsive: true
    };
    public barChartType:string = 'bar';
    public barChartLegend:boolean = true;
    public barChartLabels:string[] = [ "Paragraph 1",  "Paragraph 2",  "Paragraph 3" , "Paragraph 4" , "Paragraph 5",  "Paragraph 6" ,  "Paragraph 7",  "Paragraph 8"];
    public barChartData:any[] = [
    {data: [0, 0, 0, 0, 0, 0, 0], label: 'Your score'},
    {data: [0, 0, 0, 0, 0, 0, 0], label: 'Highest Score'}
    ];
    // private barChartData: any[] = [];

    constructor(private resultService: ResultService){}

    ngOnInit(): void {
        let userScoreData = [];
        let highestScoreData = [];
        let component = this;
        this.resultService.getUserScoreforParagraphs(function (results) {
            userScoreData = results;
            component.resultService.getHighestResults().then(sentences => {
                for(let sentence of sentences){
                    highestScoreData.push(sentence.highestScore);
                }
                component.barChartData = [{data: userScoreData, label: 'Your score'}, {data: highestScoreData, label: 'Highest Score'}];
            });
        });

    }





}