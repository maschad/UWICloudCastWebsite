
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {AuthGuard} from "../auth/guards/auth-guard";
import {Routes, RouterModule} from "@angular/router";
import {HttpModule, JsonpModule} from "@angular/http";
import {SidebarModule} from "ng-sidebar";
import {InMemoryDataService} from "../reading-area/services/in-memory-data.service";
import {InMemoryWebApiModule} from "angular-in-memory-web-api";
import {PracticeService} from "./services/practice-service";
import {PracticeAreaComponent} from "./components/practice-area";

/**
 * Created by carlos on 5/7/17.
 */

const routes: Routes = [
    {path: 'practice', component: PracticeAreaComponent, canActivate: [AuthGuard]}
];

@NgModule({
    declarations: [
        PracticeAreaComponent
    ],
    imports: [
        CommonModule,
        HttpModule,
        JsonpModule,
        InMemoryWebApiModule.forRoot(InMemoryDataService),
        SidebarModule.forRoot(),
        RouterModule.forChild(routes)
    ],
    providers: [
        PracticeService
    ]
})

export class PracticeModule {}

export { PracticeService };