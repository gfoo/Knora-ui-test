import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ConvertJSONLD, ReadResource } from '@knora/core';
import { Observable } from 'rxjs';
import { concatAll, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

declare let require: any;
const jsonld = require('jsonld');

export class Thing {
  id: string;
  label: string;
  text: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  things$: Observable<Thing[]>;

  thingIri = 'http://0.0.0.0:3333/ontology/0001/anything/v2';

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
        map(jsonldReturned => {
          return jsonld.promises
            .compact(jsonldReturned, {})
            .then(
              compacted =>
                ConvertJSONLD.createReadResourcesSequenceFromJsonLD(compacted)
                  .resources
            );
        }),
        concatAll(),
        map((resources: ReadResource[]) =>
          resources.map(res => {
            let text = 'NO VALUE';
            if (res.properties[this.thingIri + '#hasText']) {
              text = res.properties[this.thingIri + '#hasText'][0].str;
            }
            return {
              id: res.id,
              label: res.label,
              text: text
            } as Thing;
          })
        )
      );
  }
}
