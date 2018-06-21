import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ConvertJSONLD, ReadResource } from '@knora/core';
import { Observable } from 'rxjs';
import { map, mergeAll, toArray } from 'rxjs/operators';
import { environment } from '../environments/environment';

export class Thing {
  id: string;
  text: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  things$: Observable<Thing[]>;

  gravQuery = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/simple/v2#>
PREFIX any: <http://0.0.0.0:3333/ontology/0001/anything/simple/v2#>
CONSTRUCT {
  ?s knora-api:isMainResource true .
  ?s any:hasText ?text .
} WHERE {
  ?s a knora-api:Resource .
  ?s a any:Thing .
  OPTIONAL {
    ?s any:hasText ?text .
    any:hasText knora-api:objectType xsd:string .
    ?text a xsd:string .
  }
}`;

  constructor(private http: HttpClient) {}
  ngOnInit() {
    this.things$ = this.http
      .get<Thing[]>(
        environment.api +
          '/v2/searchextended/' +
          encodeURIComponent(this.gravQuery)
      )
      .pipe(
        // tap(console.log),
        map(
          jsonld =>
            ConvertJSONLD.createReadResourcesSequenceFromJsonLD(jsonld)
              .resources
        ),
        mergeAll(),
        // tap(console.log),
        map(
          (res: ReadResource) =>
            ({
              id: res.id,
              text: '?' // FIXME: get hasText value from resource
            } as Thing)
        ),
        toArray()
      );
  }
}
