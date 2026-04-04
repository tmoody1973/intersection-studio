# LinkedIn Post — MKE Neighborhood Vitality Dashboard

Philadelphia launched the Kensington Dashboard last month and it's gotten real attention — GovTech covered it as a model for data-driven revitalization, the Philadelphia Inquirer framed it as the transparency tool Mayor Parker promised so residents could "see, touch, and feel" government at work. 30 metrics from 20+ city agencies in one public view. Crime, vacancy, 311 response times, community resources. Real-time, nothing hidden.

What made it land: they published uncomfortable numbers alongside wins. 33% on-time service request rate in February — right next to zero shootings that same month. Kristin Bray, who leads the initiative, put it plainly: "We're really giving the community members this data so they can advocate on behalf of themselves." They even mapped where people arrested in Kensington actually live — turns out the vast majority are Philadelphia residents, not outsiders. Data beating back myths.

I spent part of my weekend building Milwaukee's version. Targeting Lindsay Heights, Amani, Harambee, Metcalfe Park, and four other northside neighborhoods first.

Here's the thing — Milwaukee already has the data. ArcGIS Server with 30+ REST services. MPROP tracking 160,000 properties weekly since 1975. Live police and fire dispatch. A full open data portal. What we don't have is a public tool that connects any of it into something a resident can actually use without querying an API.

Where I'm pushing past what Philly built:

**AI chat layer.** CopilotKit lets residents ask plain-language questions and get back charts and tables generated on the fly. "How many vacant properties in Harambee?" gets you an actual answer with data, not a static page you have to interpret yourself.

**Multilingual from day one.** Milwaukee is 17% Spanish-speaking. We have one of the largest Hmong populations in the country. The Health Department already publishes in English, Spanish, Hmong, and Arabic — the dashboard should too. Claude handles the AI chat in all four languages natively, no translation API needed.

**Mobile-first.** Philly's dashboard literally says "we recommend viewing on a computer." Most residents in these neighborhoods are accessing on phones. That's who I'm designing for.

**Historical redlining overlay.** No other city dashboard connects past disinvestment to present conditions visually. Milwaukee's should.

What's coming next — the data layers I'm wiring in:

*Economic development & housing:* building permits and construction investment by neighborhood, property sales trends going back to 2002, TIF district performance, Opportunity Zone boundaries, and housing affordability tracking so we can see whether new investment is displacing people or lifting them up. All of it already lives in Milwaukee's open data portal and ArcGIS — it just needs a front door.

*Community access & resources:* food desert mapping (21% of Milwaukee — about 118,900 people — live more than a mile from a grocery store), Hunger Task Force pantry locations, library and public WiFi access points, broadband adoption rates by census tract, and a metric I keep thinking about — households without a vehicle, because no car plus no nearby grocery store is the real definition of a food desert.

*Full Kensington parity:* the architecture maps every one of Philly's 30 metrics to a Milwaukee equivalent. Crime incidents, EMS and fire calls, traffic crashes, code violations, liquor licenses, transit coverage, overdose data from the Medical Examiner. Milwaukee publishes all of it across 196 CKAN datasets and 30+ ArcGIS services. Nobody's stitched it together yet.

Still early. Working prototype is live. If you're doing civic data work in Milwaukee or have built something similar in another city, I want to hear about it.

#CivicTech #Milwaukee #OpenData #CopilotKit
