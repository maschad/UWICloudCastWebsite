/**
 * Created by carlos on 3/11/17.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import {InMemoryDataService} from "./services/in-memory-data.service";

import { AuthGuard } from '../auth';

import { ReadingService } from './services/reading-service'
import {ReadingAreaComponent} from "./components/reading-area";
import { HttpModule, JsonpModule} from "@angular/http";


const routes: Routes = [
    {path: 'reading', component: ReadingAreaComponent, canActivate: [AuthGuard]}
];

@NgModule({
    declarations: [
        ReadingAreaComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        HttpModule,
        JsonpModule,
        InMemoryWebApiModule.forRoot(InMemoryDataService),
        RouterModule.forChild(routes)
    ],
    providers: [
        ReadingService
    ]
})

export class ReadingModule {}

export { ReadingService };