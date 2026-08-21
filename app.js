const COUNTRIES = [
['us','United States','Washington, D.C.','North America'],['ca','Canada','Ottawa','North America'],['mx','Mexico','Mexico City','North America'],['gt','Guatemala','Guatemala City','Central America'],['cr','Costa Rica','San José','Central America'],['pa','Panama','Panama City','Central America'],['cu','Cuba','Havana','Caribbean'],['jm','Jamaica','Kingston','Caribbean'],['do','Dominican Republic','Santo Domingo','Caribbean'],
['br','Brazil','Brasília','South America'],['ar','Argentina','Buenos Aires','South America'],['cl','Chile','Santiago','South America'],['pe','Peru','Lima','South America'],['co','Colombia','Bogotá','South America'],['ve','Venezuela','Caracas','South America'],['ec','Ecuador','Quito','South America'],['bo','Bolivia','Sucre','South America'],['uy','Uruguay','Montevideo','South America'],['py','Paraguay','Asunción','South America'],
['gb','United Kingdom','London','Europe'],['ie','Ireland','Dublin','Europe'],['fr','France','Paris','Europe'],['de','Germany','Berlin','Europe'],['es','Spain','Madrid','Europe'],['pt','Portugal','Lisbon','Europe'],['it','Italy','Rome','Europe'],['nl','Netherlands','Amsterdam','Europe'],['be','Belgium','Brussels','Europe'],['ch','Switzerland','Bern','Europe'],['at','Austria','Vienna','Europe'],['pl','Poland','Warsaw','Europe'],['cz','Czechia','Prague','Europe'],['dk','Denmark','Copenhagen','Europe'],['no','Norway','Oslo','Europe'],['se','Sweden','Stockholm','Europe'],['fi','Finland','Helsinki','Europe'],['is','Iceland','Reykjavík','Europe'],['gr','Greece','Athens','Europe'],['ro','Romania','Bucharest','Europe'],['ua','Ukraine','Kyiv','Europe'],
['ma','Morocco','Rabat','Africa'],['dz','Algeria','Algiers','Africa'],['eg','Egypt','Cairo','Africa'],['ng','Nigeria','Abuja','Africa'],['gh','Ghana','Accra','Africa'],['sn','Senegal','Dakar','Africa'],['et','Ethiopia','Addis Ababa','Africa'],['ke','Kenya','Nairobi','Africa'],['tz','Tanzania','Dodoma','Africa'],['ug','Uganda','Kampala','Africa'],['za','South Africa','Pretoria','Africa'],['zw','Zimbabwe','Harare','Africa'],['mg','Madagascar','Antananarivo','Africa'],
['tr','Türkiye','Ankara','Asia'],['sa','Saudi Arabia','Riyadh','Asia'],['ae','United Arab Emirates','Abu Dhabi','Asia'],['il','Israel','Jerusalem','Asia'],['jo','Jordan','Amman','Asia'],['iq','Iraq','Baghdad','Asia'],['ir','Iran','Tehran','Asia'],['in','India','New Delhi','Asia'],['pk','Pakistan','Islamabad','Asia'],['bd','Bangladesh','Dhaka','Asia'],['np','Nepal','Kathmandu','Asia'],['lk','Sri Lanka','Sri Jayawardenepura Kotte','Asia'],['cn','China','Beijing','Asia'],['jp','Japan','Tokyo','Asia'],['kr','South Korea','Seoul','Asia'],['kp','North Korea','Pyongyang','Asia'],['mn','Mongolia','Ulaanbaatar','Asia'],['th','Thailand','Bangkok','Asia'],['vn','Vietnam','Hanoi','Asia'],['my','Malaysia','Kuala Lumpur','Asia'],['sg','Singapore','Singapore','Asia'],['id','Indonesia','Jakarta','Asia'],['ph','Philippines','Manila','Asia'],
['au','Australia','Canberra','Oceania'],['nz','New Zealand','Wellington','Oceania'],['fj','Fiji','Suva','Oceania'],['pg','Papua New Guinea','Port Moresby','Oceania']
].map(([code,name,capital,region])=>({code,name,capital,region}));

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
const state={type:'flag',deck:[],index:0,correct:0,incorrect:0,streak:0,answered:false,results:[],standby:false,timer:null,mapTimer:null,globeTimer:null,mapToken:0,answerCount:Math.min(8,Math.max(2,Number(localStorage.getItem('atlasAnswerCount'))||4))};
const MAP_NAMES={'United States':'United States of America','Dominican Republic':'Dominican Rep.','Türkiye':'Turkey'};
const CITY_ALIASES={'Washington, D.C.':'Washington','Sri Jayawardenepura Kotte':'Sri Jayewardenepura Kotte','Andorra la Vella':'Andorra',"St. George's":"Saint George's",'Guatemala City':'Guatemala','South Tarawa':'Tarawa','Kuwait City':'Kuwait','Ulan Bator':'Ulaanbaatar','City of San Marino':'San Marino'};
const CAPITAL_COORDS={us:[-77.0369,38.9072],gt:[-90.5069,14.6349],lk:[79.8612,6.8941],nr:[166.9209,-.5477],pw:[134.6243,7.5006]};
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
const continentOf=region=>['North America','Central America','Caribbean'].includes(region)?'North America':region;
const CONTINENT_BOUNDS={
  'North America':[-170,5,-50,83],'South America':[-85,-58,-30,15],Europe:[-25,34,45,72],Africa:[-20,-40,55,40],Asia:[25,-10,179,80],Oceania:[108,-52,179,12]
};
const geographyPromise=window.atlasData.loadGeography();

function populateCountryPool(metadata,populations){
  const populationNames={'DR Congo':'The Democratic Republic of Congo','Republic of the Congo':'Congo','Czechia':'Czech Republic','Fiji':'Fiji Islands','Micronesia':'Micronesia, Federated States of','São Tomé and Príncipe':'Sao Tome and Principe','Timor-Leste':'East Timor','Türkiye':'Turkey','Vatican City':'Holy See (Vatican City State)'},populationMap=new Map(populations.map(item=>[item.country,item.population]));
  const expanded=metadata.filter(meta=>(meta.unMember||['VA','PS','TW'].includes(meta.cca2))&&meta.capital?.length&&meta.ccn3&&meta.cca2!=='TV').map(meta=>{
    let region=meta.region;if(region==='Americas')region=meta.subregion==='South America'?'South America':meta.subregion==='Central America'?'Central America':meta.subregion==='Caribbean'?'Caribbean':'North America';
    const population=populationMap.get(populationNames[meta.name.common]||meta.name.common)||(meta.cca2==='TW'?23400000:null);
    return {code:meta.cca2.toLowerCase(),name:meta.name.common,capital:meta.capital[0],region,population,area:meta.area,mapId:String(meta.ccn3).padStart(3,'0')};
  });
  COUNTRIES.splice(0,COUNTRIES.length,...expanded);
}
function buildRotatingDeck(count){
  const byCode=new Map(COUNTRIES.map(country=>[country.code,country])),valid=new Set(byCode.keys());let saved={queue:[],last:null};
  try{saved=JSON.parse(localStorage.getItem('atlasCountryRotation')||'{"queue":[],"last":null}')}catch{}
  let queue=[...new Set((saved.queue||[]).filter(code=>valid.has(code)))],deck=[],guard=0;
  while(deck.length<count&&guard++<2000){
    if(!queue.length){const used=new Set(deck.map(country=>country.code));queue=shuffle([...valid].filter(code=>!used.has(code)))}
    const code=queue.shift();if((!deck.length&&code===saved.last)||deck.some(country=>country.code===code)){queue.push(code);continue}deck.push(byCode.get(code));
  }
  localStorage.setItem('atlasCountryRotation',JSON.stringify({queue,last:deck.at(-1)?.code||saved.last}));return deck;
}
function geometryFor(topology,country){return topology.objects.countries.geometries.find(geometry=>country.mapId?String(geometry.id).padStart(3,'0')===country.mapId:geometry.properties.name===(MAP_NAMES[country.name]||country.name))}
function framedCountryFeature(country,feature){
  if(!['fr','us'].includes(country.code)||feature.geometry.type!=='MultiPolygon')return feature;
  const mainland=feature.geometry.coordinates.reduce((largest,coordinates)=>{const polygon={type:'Polygon',coordinates};return !largest||d3.geoArea(polygon)>d3.geoArea(largest)?polygon:largest},null);
  return {...feature,geometry:mainland};
}
function shortPopulation(value){if(!value)return '—';if(value>=1e9)return `${(value/1e9).toFixed(2).replace(/\.00$/,'')}B`;if(value>=1e6)return `${(value/1e6).toFixed(1).replace(/\.0$/,'')}M`;if(value>=1e3)return `${(value/1e3).toFixed(1).replace(/\.0$/,'')}K`;return String(value)}
function buildMission(){
  clearTimeout(state.timer);clearTimeout(state.mapTimer);clearTimeout(state.globeTimer);state.mapToken++;state.deck=buildRotatingDeck(20);state.index=0;state.correct=0;state.incorrect=0;state.streak=0;state.results=[];state.answered=false;
  renderLights();renderQuestion();
}
function questionMode(){return state.type}
function getOptions(target,key){return shuffle([target,...shuffle(COUNTRIES.filter(c=>c!==target&&c[key]!==target[key])).slice(0,state.answerCount-1)]).map(c=>c[key])}
function renderQuestion(){
  if(state.index>=state.deck.length){if(state.standby)return buildMission();return completeMission()}
  const c=state.deck[state.index],mode=questionMode();state.answered=false;
  $('#nextQuestion').classList.add('show');$('#nextQuestion').classList.remove('ready');$('#previousQuestion').classList.add('show');$('#nextQuestion').setAttribute('aria-label','Next question');$('#intel').classList.remove('show');$('#flagMemory').classList.remove('show');$('#visualFrame').classList.remove('map-reveal','map-loading','context-shift','continent-reveal','globe-reveal','shape-question');$('#countryMap').innerHTML='';$('#flag').style.display=mode==='flag'?'block':'none';$('#capitalQuestion').style.display=mode==='capital'?'grid':'none';
  if(mode==='flag'){$('#flag').src=`node_modules/flag-icons/flags/4x3/${c.code}.svg`;$('#flag').alt=`Flag target ${state.index+1}`}else if(mode==='shape')renderShapePrompt(c,state.mapToken);else $('#capitalQuestion').textContent=c.capital;
  const key='name',options=getOptions(c,key);$('#answers').className=`answers count-${options.length}`;$('#answers').innerHTML=options.map((o,i)=>{const optionCountry=COUNTRIES.find(country=>country.name===o);return mode==='capital'||mode==='shape'?`<button class="answer flag-answer" data-value="${o.replace(/"/g,'&quot;')}"><img class="answer-flag" src="node_modules/flag-icons/flags/4x3/${optionCountry.code}.svg" alt=""><b>${i+1}</b><span class="answer-label">${o}</span></button>`:`<button class="answer" data-value="${o.replace(/"/g,'&quot;')}"><b>${i+1}</b>${o}</button>`}).join('');
  $$('.answer').forEach(b=>b.onclick=()=>answer(b.dataset.value));updateStats();setPhase(state.standby?'SCANNING TARGET':'AWAITING OPERATOR INPUT');
  const card=$('.quiz-card');card.classList.remove('exiting');card.classList.add('entering');requestAnimationFrame(()=>requestAnimationFrame(()=>card.classList.remove('entering')));
  if(state.standby){$$('.answer').forEach(b=>b.disabled=true);state.timer=setTimeout(()=>answer(c[key],true),4200)}
}
function answer(value,automatic=false){
  if(state.answered)return;state.answered=true;clearTimeout(state.timer);const c=state.deck[state.index],key='name',right=c[key],ok=value===right;
  $$('.answer').forEach(b=>{b.disabled=true;if(b.dataset.value===right)b.classList.add('correct');else if(b.dataset.value===value)b.classList.add('wrong')});
  if(ok){state.correct++;state.streak++}else{state.incorrect++;state.streak=0}state.results.push(ok?'good':'bad');
  $('#memoryFlag').src=`node_modules/flag-icons/flags/4x3/${c.code}.svg`;$('#memoryFlag').alt=`Flag of ${c.name}`;$('#flagMemory').classList.add('show');$('#intelCountry').textContent=c.name;$('#intelCapital').textContent=c.capital;$('#intelPopulation').textContent=shortPopulation(c.population);$('#intel').classList.add('show');revealCountryMap(c);updateStats();renderLights();saveLifetime(ok);
  setPhase(automatic?'ANSWER ACQUIRED // REVIEW':'INTEL CONFIRMED // NEXT TARGET');if(automatic)state.timer=setTimeout(next,13200);else $('#nextQuestion').classList.add('show')
}
function next(){clearTimeout(state.timer);clearTimeout(state.mapTimer);clearTimeout(state.globeTimer);state.mapToken++;const card=$('.quiz-card');card.classList.add('exiting');state.timer=setTimeout(()=>{state.index++;renderQuestion()},420)}
function previous(){if(state.index<=0){const button=$('#previousQuestion');button.classList.remove('invalid');void button.offsetWidth;button.classList.add('invalid');setTimeout(()=>button.classList.remove('invalid'),1400);return}clearTimeout(state.timer);clearTimeout(state.mapTimer);clearTimeout(state.globeTimer);state.mapToken++;const target=state.index-1;state.results.length=Math.min(state.results.length,target);state.correct=state.results.filter(result=>result==='good').length;state.incorrect=state.results.filter(result=>result==='bad').length;state.streak=0;for(let i=state.results.length-1;i>=0&&state.results[i]==='good';i--)state.streak++;renderLights();const card=$('.quiz-card');card.classList.add('exiting');state.timer=setTimeout(()=>{state.index=target;state.answered=false;renderLights();renderQuestion()},420)}
function updateStats(){}
function renderLights(){$('#lightbar').innerHTML=Array.from({length:20},(_,i)=>`<i class="${state.results[i]||''}"></i>`).join('')}
function completeMission(){setPhase(`MISSION COMPLETE // ${Math.round(state.correct/state.deck.length*100)}% ACCURACY`);state.timer=setTimeout(buildMission,2500)}
function setPhase(t){}
async function renderShapePrompt(country,token){
  try{
    const {topology}=await geographyPromise;if(token!==state.mapToken)return;
    const geometry=geometryFor(topology,country);if(!geometry)return;
    const feature=framedCountryFeature(country,topojson.feature(topology,geometry)),projection=d3.geoMercator().fitExtent([[76,48],[684,382]],feature),path=d3.geoPath(projection),svg=d3.select('#countryMap');
    svg.attr('aria-label','Country outline to identify');svg.append('path').attr('class','map-shadow').attr('d',path(feature));svg.append('path').attr('class','map-outline shape-outline').attr('d',path(feature));$('#visualFrame').classList.add('shape-question');
  }catch(error){console.error('Shape prompt unavailable',error)}
}
async function revealCountryMap(country){
  const frame=$('#visualFrame'),svg=d3.select('#countryMap');frame.classList.remove('shape-question');frame.classList.add('map-loading');
  try{
    const {topology,cities,countries}=await geographyPromise;
    const geometry=geometryFor(topology,country);
    if(!geometry)return;
    const feature=framedCountryFeature(country,topojson.feature(topology,geometry)),projection=d3.geoMercator().fitExtent([[76,48],[684,382]],feature),path=d3.geoPath(projection);
    const targetCity=normalize(CITY_ALIASES[country.capital]||country.capital);
    const candidates=cities.filter(city=>String(city.iso2||'').toLowerCase()===country.code);
    const capital=candidates.find(city=>normalize(city.city)===targetCity||normalize(city.city_ascii||'')===targetCity)||candidates.sort((a,b)=>(b.pop||0)-(a.pop||0))[0];
    svg.selectAll('*').remove();svg.attr('aria-label',`${country.name} outline with ${country.capital} marked`);
    svg.append('path').attr('class','map-shadow').attr('d',path(feature));
    svg.append('path').attr('class','map-outline').attr('d',path(feature));
    const coordinates=CAPITAL_COORDS[country.code]||(capital&&[capital.lng,capital.lat]);
    if(coordinates){const [x,y]=projection(coordinates);svg.append('circle').attr('class','capital-ping').attr('cx',x).attr('cy',y).attr('r',18);svg.append('circle').attr('class','capital-dot').attr('cx',x).attr('cy',y).attr('r',4.5);svg.append('text').attr('class','capital-label').attr('x',x+13).attr('y',y-10).text(country.capital.toUpperCase())}
    requestAnimationFrame(()=>{frame.classList.remove('map-loading');frame.classList.add('map-reveal')});
    const token=state.mapToken;
    state.mapTimer=setTimeout(()=>{if(token===state.mapToken)showGlobeContext(country,topology,coordinates,token)},4300);
  }catch(error){console.error('Map reveal unavailable',error);frame.classList.remove('map-loading')}
}
function showContinentContext(country,topology,countries,capitalCoordinates,token){
  const svg=d3.select('#countryMap'),frame=$('#visualFrame'),targetName=MAP_NAMES[country.name]||country.name,targetContinent=continentOf(country.region);
  const continentFor=meta=>meta.region==='Americas'?(meta.subregion==='South America'?'South America':'North America'):meta.region;
  const ids=new Set(countries.filter(meta=>continentFor(meta)===targetContinent).map(meta=>String(meta.ccn3).padStart(3,'0')));
  const geometries=topology.objects.countries.geometries.filter(g=>ids.has(String(g.id).padStart(3,'0'))),collection={type:'GeometryCollection',geometries};
  const featureCollection=topojson.feature(topology,collection),bounds=CONTINENT_BOUNDS[targetContinent],focus={type:'Polygon',coordinates:[[[bounds[0],bounds[1]],[bounds[2],bounds[1]],[bounds[2],bounds[3]],[bounds[0],bounds[3]],[bounds[0],bounds[1]]]]},projection=d3.geoMercator().fitExtent([[34,28],[726,402]],focus),path=d3.geoPath(projection);
  frame.classList.add('context-shift');svg.selectAll('*').remove();
  svg.selectAll('path').data(featureCollection.features).enter().append('path').attr('class',feature=>feature.properties.name===targetName?'context-country target-country':'context-country').attr('d',path);
  if(capitalCoordinates){const [x,y]=projection(capitalCoordinates);svg.append('circle').attr('class','capital-ping context-ping').attr('cx',x).attr('cy',y).attr('r',16);svg.append('circle').attr('class','capital-dot context-dot').attr('cx',x).attr('cy',y).attr('r',4);svg.append('text').attr('class','capital-label context-label').attr('x',x+12).attr('y',y-9).text(country.capital.toUpperCase())}
  requestAnimationFrame(()=>{frame.classList.remove('map-reveal');frame.classList.add('continent-reveal')});
  state.globeTimer=setTimeout(()=>{if(token===state.mapToken)showGlobeContext(country,topology,capitalCoordinates,token)},5000);
}
function showGlobeContext(country,topology,capitalCoordinates,token){
  if(!capitalCoordinates)return;
  const svg=d3.select('#countryMap'),frame=$('#visualFrame'),targetName=MAP_NAMES[country.name]||country.name,features=topojson.feature(topology,topology.objects.countries).features;
  const [lon,lat]=capitalCoordinates,projection=d3.geoOrthographic().translate([380,215]).scale(138).clipAngle(90).precision(.35),path=d3.geoPath(projection),graticule=d3.geoGraticule10();
  svg.selectAll('*').remove();svg.append('path').datum({type:'Sphere'}).attr('class','globe-sphere');svg.append('path').datum(graticule).attr('class','globe-grid');
  const countries=svg.selectAll('.globe-country').data(features).enter().append('path').attr('class',feature=>(country.mapId?String(feature.id).padStart(3,'0')===country.mapId:feature.properties.name===targetName)?'globe-country globe-target':'globe-country');
  const ping=svg.append('circle').attr('class','capital-ping globe-ping').attr('r',16),dot=svg.append('circle').attr('class','capital-dot globe-dot').attr('r',4.5),label=svg.append('text').attr('class','capital-label globe-label').text(country.name.toUpperCase());
  frame.classList.remove('continent-reveal');frame.classList.add('globe-reveal');
  const start=performance.now(),duration=4400,startLon=lon-62,startLat=Math.max(-28,Math.min(38,lat*.35)),startScale=138,endScale=country.area?Math.min(900,Math.max(350,350*Math.pow(250000/country.area,.28))):350;
  const draw=now=>{if(token!==state.mapToken)return;const t=Math.min(1,(now-start)/duration),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,currentLon=startLon+(lon-startLon)*ease,currentLat=startLat+(lat-startLat)*ease,currentScale=startScale+(endScale-startScale)*ease;projection.rotate([-currentLon,-currentLat]).scale(currentScale);svg.select('.globe-sphere').attr('d',path);svg.select('.globe-grid').attr('d',path);countries.attr('d',path);const point=projection([lon,lat]),visible=d3.geoDistance([currentLon,currentLat],[lon,lat])<Math.PI/2;ping.attr('cx',point[0]).attr('cy',point[1]).style('opacity',visible?null:0);dot.attr('cx',point[0]).attr('cy',point[1]).style('opacity',visible?null:0);label.attr('x',point[0]+13).attr('y',point[1]-10).style('opacity',visible?null:0);if(t<1)requestAnimationFrame(draw);else if(!state.standby&&state.answered){$('#nextQuestion').classList.add('ready');$('#nextQuestion').setAttribute('aria-label','Next question');clearTimeout(state.timer);state.timer=setTimeout(next,10000)}};
  requestAnimationFrame(draw);
}
function setStandby(on){state.standby=on;clearTimeout(state.timer);document.body.classList.toggle('standby',on);$('#standbyToggle').classList.toggle('on',on);$('#modeLabel').textContent=on?'STANDBY':'ACTIVE';$('#nextQuestion').classList.add('show');$('#previousQuestion').classList.add('show');if(on){if(state.answered)state.timer=setTimeout(next,13200);else{const c=state.deck[state.index];$$('.answer').forEach(b=>b.disabled=true);setPhase('SCANNING TARGET');state.timer=setTimeout(()=>answer(c.name,true),3000)}}else{$$('.answer').forEach(b=>b.disabled=state.answered);setPhase(state.answered?'INTEL CONFIRMED // NEXT TARGET':'AWAITING OPERATOR INPUT')}}
function saveLifetime(ok){const s=JSON.parse(localStorage.getItem('atlasStats')||'{"answered":0,"correct":0}');s.answered++;if(ok)s.correct++;localStorage.setItem('atlasStats',JSON.stringify(s))}

$$('[data-quiz-mode]').forEach(button=>button.onclick=()=>{$$('[data-quiz-mode]').forEach(item=>item.classList.toggle('active',item===button));state.type=button.dataset.quizMode;buildMission()});
$('#standbyToggle').onclick=()=>setStandby(!state.standby);
$('#nextQuestion').onclick=next;
$('#previousQuestion').onclick=previous;
$('#creditsButton').onclick=()=>{$('#creditsPage').classList.add('show');$('#creditsPage').setAttribute('aria-hidden','false')};
$('#creditsClose').onclick=()=>{$('#creditsPage').classList.remove('show');$('#creditsPage').setAttribute('aria-hidden','true')};
$('#howToButton').onclick=()=>{$('#howToPage').classList.add('show');$('#howToPage').setAttribute('aria-hidden','false')};
$('#howToClose').onclick=()=>{$('#howToPage').classList.remove('show');$('#howToPage').setAttribute('aria-hidden','true')};
$('#difficultySlider').value=state.answerCount;
$('#difficultySlider').onchange=event=>{state.answerCount=Number(event.target.value);localStorage.setItem('atlasAnswerCount',state.answerCount);if(state.answered)next();else{clearTimeout(state.timer);clearTimeout(state.mapTimer);clearTimeout(state.globeTimer);state.mapToken++;renderQuestion()}};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#creditsPage').classList.contains('show')){$('#creditsClose').click();return}if(e.key==='Escape'&&$('#howToPage').classList.contains('show')){$('#howToClose').click();return}if(state.standby)return;if(/^[1-8]$/.test(e.key)&&!state.answered){const b=$$('.answer')[Number(e.key)-1];if(b)b.click()}else if(e.code==='Space'&&state.answered){e.preventDefault();next()}else if(e.code==='ArrowLeft'){e.preventDefault();previous()}});
function runBootSequence(topology){
  const screen=$('#bootScreen'),svg=d3.select('#bootGlobe');
  if(!screen)return;
  const projection=d3.geoOrthographic().translate([210,210]).scale(142).clipAngle(90).precision(.4),path=d3.geoPath(projection),start=performance.now(),duration=3300;
  svg.append('path').datum({type:'Sphere'}).attr('class','boot-sphere');
  svg.append('path').datum(d3.geoGraticule10()).attr('class','boot-grid');
  let land=null;
  if(topology){land=svg.append('path').datum(topojson.feature(topology,topology.objects.countries)).attr('class','boot-land')}
  const launch=()=>{
    if(screen.classList.contains('disintegrating'))return;
    screen.classList.add('disintegrating');
    const cloud=document.createElement('div');cloud.className='boot-particles';screen.appendChild(cloud);
    const source=screen.querySelector('.boot-orbit').getBoundingClientRect(),name=screen.querySelector('.boot-name').getBoundingClientRect();
    for(let i=0;i<150;i++){
      const particle=document.createElement('i'),fromName=i>112,x=fromName?name.left+Math.random()*name.width:source.left+source.width*(.14+Math.random()*.72),y=fromName?name.top+Math.random()*name.height:source.top+source.height*(.12+Math.random()*.76),angle=Math.random()*Math.PI*2,radius=fromName?0:Math.sqrt(Math.random())*source.width*.34;
      const px=fromName?x:source.left+source.width/2+Math.cos(angle)*radius,py=fromName?y:source.top+source.height/2+Math.sin(angle)*radius;
      particle.style.cssText=`left:${px}px;top:${py}px;--dx:${80+Math.random()*300}px;--dy:${-75+Math.random()*150}px;--delay:${Math.random()*.34}s;--size:${1+Math.random()*2.5}px`;cloud.appendChild(particle);
    }
    setTimeout(()=>{screen.classList.add('complete');document.body.classList.remove('booting')},980);
    setTimeout(()=>screen.remove(),1750);
  };
  $('#bootLaunch').onclick=launch;
  const draw=now=>{const t=Math.min(1,(now-start)/duration),ease=1-Math.pow(1-t,3),rotation=-125+205*ease,breathe=Math.sin(Math.min(1,t)*Math.PI)*10;projection.rotate([rotation,-14+7*ease]).scale(137+24*ease+breathe);svg.select('.boot-sphere').attr('d',path);svg.select('.boot-grid').attr('d',path);if(land)land.attr('d',path);if(t<1)requestAnimationFrame(draw);else screen.classList.add('ready')};
  requestAnimationFrame(draw);
}
function initializeCreditsGlobe(topology){
  const svg=d3.select('#creditsGlobe'),projection=d3.geoOrthographic().translate([400,400]).scale(320).clipAngle(90).precision(.45),path=d3.geoPath(projection),features=topojson.feature(topology,topology.objects.countries);
  projection.rotate([-25,-12]);
  svg.append('path').datum({type:'Sphere'}).attr('class','credits-sphere').attr('d',path);
  svg.append('path').datum(d3.geoGraticule10()).attr('class','credits-grid').attr('d',path);
  svg.append('path').datum(features).attr('class','credits-land').attr('d',path);
}
geographyPromise.then(({topology,countries,populations})=>{populateCountryPool(countries,populations);buildMission();runBootSequence(topology);initializeCreditsGlobe(topology)}).catch(error=>{console.error('Expanded country pool unavailable',error);buildMission();runBootSequence(null)});
