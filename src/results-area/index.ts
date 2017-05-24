import {Routes, RouterModule} from "@angular/router";
import {AuthGuard} from "../auth/guards/auth-guard";
import {ChartsModule} from "ng2-charts";
import {ResultsAreaComponent} from "./components/results-area";
import {NgModule} from "@angular/core";
import {SidebarModule} from "ng-sidebar";
import {CommonModule} from "@angular/common";
import {ResultService} from "./services/result-service";
/**
 * Created by carlos on 5/7/17.
 */


const routes: Routes = [
    {path: 'results', component: ResultsAreaComponent, canActivate: [AuthGuard]}
];

@NgModule({
    declarations: [
        ResultsAreaComponent
    ],
    imports: [
        CommonModule,
        ChartsModule,
        SidebarModule.forRoot(),
        RouterModule.forChild(routes)
    ],
    providers: [
        ResultService
    ]
})

export class ResultsModule {}

export { ResultService };
