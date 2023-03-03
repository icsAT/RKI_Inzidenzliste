// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: angry;

// RKI Inzidenz Widget
// von icsAT (https://gist.github.com/icsAT)
// Version 0.81 vom 17.02.2022

// Daten vom Robert Koch Institut
// Licence: Robert Koch-Institut (RKI), dl-de/by-2-0

// Inspiriert und immer wieder kopiert von:
// kevinkub https://gist.github.com/kevinkub/46caebfebc7e26be63403a7f0587f664
// rphl https://gist.github.com/rphl/0491c5f9cb345bf831248732374c4ef5
// tzschies https://gist.github.com/tzschies/563fab70b37609bc8f2f630d566bcbc9
// klaus-schuster https://gist.github.com/klaus-schuster/0537cd7f491a67ce61fe9064c4b4e932
// Danke für Eure tolle Arbeit!

// Das Skript wurde je nach Anzahl der gewünschten Landkreise für mittlere (max. 8-9 Landkreise) und
// große (max. 25-26 Landkreise) Widgets konzepiert.

// Wird kein Parameter übergeben wird ein Landkreis auf Basis des aktuellen Standortes angezeigt.
// Sobald Parameter übergeben werden, werden nur die Werte auf Basis der Parameter angezeigt.
// Mehrere Parameter werden durch ';' (Semikolon) getrennt. Dabei können auch mehrere Arten gemischt werden.
// Folgende Parameterarten sind möglich:
// Geodaten (z.B.: 53.5,10.0)
// RKI Landkreis ID (z.B.: 02000)
// RKI Landkreis Name (z.B.: Harburg)
// Darüberhinaus ist noch der Parameter 'LOKAL' möglich. In dem Fall wird der aktuelle Standort verwendet.
// Beispiel Parameterset für ein mittelgroßes Widget:
// lokal;Stade;53.5,10.0;Harburg;13071;09376;12069;01061
// Beispiel Parameterset für ein großes Widget:
// lokal;Hamburg;Bremen;52.35,9.76;52.44,13.45;Dortmund;Essen;Düsseldorf;Köln;50.12,8.68;Stuttgart;Nürnberg;München;Dresden;Leipzig;01002;03103;05158;06414;07133;08325;08335;09162;10041;12069

// individuelle Parameter:
// Diese können bei Bedarf individuell angepasst werden.
const LIMIT_DUNKELROT = 100
const LIMIT_ROT = 50
const LIMIT_ORANGE = 35
const LIMIT_GELB = 35

const SCHRIFTGROESSE = 10
const LK_LAENGE = 26

// Weitere Parameter
const FARBE_DUNKELROT = new Color('#CC0000') // new Color('#8B0000') (Dunkelrot ist im Darkmodus nicht lesbar)
const FARBE_ROT = new Color('#FF0000')
const FARBE_ORANGE = new Color('#FFA500')
const FARBE_GELB = new Color('#FFFF00')
const FARBE_GRUEN = new Color('#008000')
const FARBE_GRAU = new Color('#808080')
const FARBE_DUNKELGRAU = new Color('#A9A9A9')

// URL's um die Landkreis und Bundesland Inzidenzen zu ermitteln
const lkAusgabe="RS,GEN,BEZ,BL,BL_ID,county,last_update,cases7_per_100k,cases7_bl_per_100k"
const rkiAPI_Geodaten = (geodaten) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=${lkAusgabe}&geometry=${geodaten.longitude.toFixed(3)}%2C${geodaten.latitude.toFixed(3)}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`
const rkiAPI_lkID = (lkID) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=RS%20%3D%20${lkID}&outFields=${lkAusgabe}&returnGeometry=false&outSR=4326&f=json`
const rkiAPI_lkName = (lkName) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=GEN%20%3D%20%27${lkName}%27&outFields=${lkAusgabe}&returnGeometry=false&outSR=4326&f=json`

// URL's um die neuen Fälle im Landkreis, Bundesland und in Deutschland zu ermitteln
const rkiAPI_lkAnzahlNeueFaelle = (lkID) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/Covid19_hubv/FeatureServer/0/query?where=IdLandkreis=${lkID}+AND+NeuerFall%20in%20(-1%2C1)&outFields=*&returnGeometry=false&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22lkAnzahlNeueFaelle%22%7D%5D&f=json`
const rkiAPI_blAnzahlNeueFaelle = (blID) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/Covid19_hubv/FeatureServer/0/query?where=IdBundesland=${blID}+AND+NeuerFall%20in%20(-1%2C1)&outFields=*&returnGeometry=false&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22blAnzahlNeueFaelle%22%7D%5D&f=json`
const rkiAPI_deAnzahlNeueFaelle = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/ArcGIS/rest/services/Covid19_hubv/FeatureServer/0/query?where=NeuerFall%20in%20(-1%2C1)&outFields=*&returnGeometry=false&outStatistics=%5B%7B%22statisticType%22%3A%22sum%22%2C%22onStatisticField%22%3A%22AnzahlFall%22%2C%22outStatisticFieldName%22%3A%22deAnzahlNeueFaelle%22%7D%5D&f=json'

// Bundesländer Mapping
const BUNDESLAENDER_SHORT = {
    'Baden-Württemberg': 'BW',
    'Bayern': 'BY',
    'Berlin': 'BE',
    'Brandenburg': 'BB',
    'Bremen': 'HB',
    'Hamburg': 'HH',
    'Hessen': 'HE',
    'Mecklenburg-Vorpommern': 'MV',
    'Niedersachsen': 'NI',
    'Nordrhein-Westfalen': 'NRW',
    'Rheinland-Pfalz': 'RP',
    'Saarland': 'SL',
    'Sachsen': 'SN',
    'Sachsen-Anhalt': 'ST',
    'Schleswig-Holstein': 'SH',
    'Thüringen': 'TH'
};

// Ablaufsteuerung Skript
let widget = await createWidget()

if (config.runsInWidget) {
    Script.setWidget(widget)
} else {
    await widget.presentLarge()
}

Script.complete()

// Widget generieren
async function createWidget() {

    let list = new ListWidget()
    list.backgroundColor = Color.clear()

    stack = list.addStack()
    kopf = stack.addText("🦠 RKI Inzidenzliste")
    kopf.font = Font.boldSystemFont(15)

    stack = list.addStack()

    deDaten = await deDatenHolen()
    if (deDaten) {
        deZeile = stack.addText("Neue Fälle in Deutschland: "+deDaten.deAnzahlNeueFaelle)
        
    } else {
        deZeile = stack.addText("Neue Fälle in Deutschland: unbekannt!")
    }
    deZeile.font = Font.mediumSystemFont(SCHRIFTGROESSE)

    if (args.widgetParameter) {
        var parameters = args.widgetParameter.split(";")
    } else {
        var parameters = ["LOKAL"]
    }
    
    datenVon = "01.01.1900"
    var parAnzahl = 0

    for (parameter of parameters) {
        
        parameter_modifiziert = parameter
        parameter_modifiziert = parameter_modifiziert.trim()
        parameter_modifiziert = parameter_modifiziert.toUpperCase()
        parameter_modifiziert = parameter_modifiziert.replace(" ", "%20")
        parameter_modifiziert = parameter_modifiziert.replace("Ä", "%C3%84")
        parameter_modifiziert = parameter_modifiziert.replace("Ü", "%C3%9C")
        parameter_modifiziert = parameter_modifiziert.replace("Ö", "%C3%96")
        parameter_modifiziert = parameter_modifiziert.replace("ß", "SS")

        parAnzahl++

        stack = list.addStack()

        lkDaten = await lkDatenHolen(parameter_modifiziert)
        if (lkDaten) {
            datenVon = lkDaten.letztesUpdate
            anzDaten = await anzDatenHolen(lkDaten.lkID, lkDaten.blID)
            lk_bez = lkDaten.landkreis+" ("+lkDaten.k_art+")"
            lk_bez = lk_bez.substr(0, LK_LAENGE)
            if (anzDaten) {
                datenzeile = stack.addText(lk_bez+" "+lkDaten.lkInzidenz+" (+"+anzDaten.lkAnzahlNeueFaelle+") ")
                datenzeile.textColor = textFarbeHolen(lkDaten.lkInzidenz)
                datenzeile.font = Font.mediumSystemFont(SCHRIFTGROESSE)
                datenzeile = stack.addText(lkDaten.bundesland_kurz+" "+lkDaten.blInzidenz+" (+"+anzDaten.blAnzahlNeueFaelle+")")
                datenzeile.textColor = textFarbeHolen(lkDaten.blInzidenz)
                datenzeile.font = Font.mediumSystemFont(SCHRIFTGROESSE)
            } else {
                datenzeile = stack.addText(lk_bez+" "+lkDaten.lkInzidenz+" ")
                datenzeile.textColor = textFarbeHolen(lkDaten.lkInzidenz)
                datenzeile.font = Font.mediumSystemFont(SCHRIFTGROESSE)
                datenzeile = stack.addText(lkDaten.bundesland_kurz+" "+lkDaten.blInzidenz)
                datenzeile.textColor = textFarbeHolen(lkDaten.blInzidenz)
                datenzeile.font = Font.mediumSystemFont(SCHRIFTGROESSE)
            }
        } else {
            datenzeile = stack.addText("Daten für Parameter '")
            datenzeile.textColor = FARBE_DUNKELGRAU
            datenzeile.font = Font.mediumSystemFont(SCHRIFTGROESSE)
            datenzeile = stack.addText(parameter)
            datenzeile.textColor = FARBE_ROT
            datenzeile.font = Font.mediumSystemFont(SCHRIFTGROESSE)
            datenzeile = stack.addText("' nicht verfügbar!!!")
            datenzeile.textColor = FARBE_DUNKELGRAU
            datenzeile.font = Font.mediumSystemFont(SCHRIFTGROESSE)
        }

        if (lkDaten && lkDaten.ShouldCache) {
            list.refreshAfterDate = new Date(Date.now() + 60 * 60 * 1000)
        }
        
    }

    stack = list.addStack()
    if ((parAnzahl<=9 && (config.widgetFamily == 'medium')) || (parAnzahl<=25 && (config.widgetFamily == 'large'))) {
        stack.layoutVertically()
        stack.addSpacer()
        stack.bottomAlignContent()
    }
    fuss = stack.addText("RKI Datenbestand vom "+datenVon)
    fuss.font = Font.mediumSystemFont(8)
    fuss.textColor = FARBE_GRAU

    return list

}

// Textfarbe setzen
function textFarbeHolen(inzidenz) {
    let farbe = FARBE_GRUEN
    if (inzidenz >= LIMIT_DUNKELROT) {
        farbe = FARBE_DUNKELROT
    } else if (inzidenz >= LIMIT_ROT) {
        farbe = FARBE_ROT
    } else if (inzidenz >= LIMIT_ORANGE) {
        farbe = FARBE_ORANGE
    } else if (inzidenz >= LIMIT_GELB) {
        farbe = FARBE_GELB
    }
    return farbe
}

// Daten vom RKI holen
async function lkDatenHolen(parameter) {
    try {
        if (parameter.length = 5 && !isNaN(parameter)) {
            let lkDaten = await new Request(rkiAPI_lkID(parameter)).loadJSON()
            const lkAttribute = lkDaten.features[0].attributes
            return { 
                lkID: lkAttribute.RS,
                landkreis: lkAttribute.GEN,
                k_art: lkAttribute.BEZ,
                bundesland: lkAttribute.BL,
                bundesland_kurz: BUNDESLAENDER_SHORT[lkAttribute.BL],
                blID: lkAttribute.BL_ID,
                landkreis2: lkAttribute.county,
                letztesUpdate: lkAttribute.last_update,
                lkInzidenz: parseFloat(lkAttribute.cases7_per_100k.toFixed(1)),
                blInzidenz: parseFloat(lkAttribute.cases7_bl_per_100k.toFixed(1)),
                shouldCache: true
            }
        } else if ((parameter.length > 5 && parameter.includes(',') && parameter.includes('.')) || (parameter == "LOKAL")) {
            const geodaten = await holeGeodaten(parameter)
            let lkDaten = await new Request(rkiAPI_Geodaten(geodaten)).loadJSON()
            const lkAttribute = lkDaten.features[0].attributes
            return { 
                lkID: lkAttribute.RS,
                landkreis: lkAttribute.GEN,
                k_art: lkAttribute.BEZ,
                bundesland: lkAttribute.BL,
                bundesland_kurz: BUNDESLAENDER_SHORT[lkAttribute.BL],
                blID: lkAttribute.BL_ID,
                landkreis2: lkAttribute.county,
                letztesUpdate: lkAttribute.last_update,
                lkInzidenz: parseFloat(lkAttribute.cases7_per_100k.toFixed(1)),
                blInzidenz: parseFloat(lkAttribute.cases7_bl_per_100k.toFixed(1)),
                shouldCache: true
            }
        } else {
            let lkDaten = await new Request(rkiAPI_lkName(parameter)).loadJSON()
            const lkAttribute = lkDaten.features[0].attributes
            return { 
                lkID: lkAttribute.RS,
                landkreis: lkAttribute.GEN,
                k_art: lkAttribute.BEZ,
                bundesland: lkAttribute.BL,
                bundesland_kurz: BUNDESLAENDER_SHORT[lkAttribute.BL],                    
                blID: lkAttribute.BL_ID,
                landkreis2: lkAttribute.county,
                letztesUpdate: lkAttribute.last_update,
                lkInzidenz: parseFloat(lkAttribute.cases7_per_100k.toFixed(1)),
                blInzidenz: parseFloat(lkAttribute.cases7_bl_per_100k.toFixed(1)),
                shouldCache: true
            }
        }
        
    } catch(e) {
        return null;
    }
}

async function deDatenHolen() {

    let deFallDaten = await new Request(rkiAPI_deAnzahlNeueFaelle).loadJSON()
    let deAnzahlNeueFaelle = deFallDaten.features[0].attributes.deAnzahlNeueFaelle
    if (deAnzahlNeueFaelle == null) {
        deAnzahlNeueFaelle = 0
    }

    return {
        deAnzahlNeueFaelle: deAnzahlNeueFaelle.toLocaleString('de-DE'),
        shouldCache: true
    }
}

async function anzDatenHolen(lkID, blID) {
    try {
        
        let lkFallDaten = await new Request(rkiAPI_lkAnzahlNeueFaelle(lkID)).loadJSON()
        let lkAnzahlNeueFaelle = lkFallDaten.features[0].attributes.lkAnzahlNeueFaelle
        if (lkAnzahlNeueFaelle == null) {
            lkAnzahlNeueFaelle = 0
        }

        let blFallDaten = await new Request(rkiAPI_blAnzahlNeueFaelle(blID)).loadJSON()
        let blAnzahlNeueFaelle = blFallDaten.features[0].attributes.blAnzahlNeueFaelle
        if (blAnzahlNeueFaelle == null) {
            blAnzahlNeueFaelle = 0
        }

        return { 
            lkAnzahlNeueFaelle: lkAnzahlNeueFaelle.toLocaleString('de-DE'),
            blAnzahlNeueFaelle: blAnzahlNeueFaelle.toLocaleString('de-DE'),
            shouldCache: true
        }

    } catch(e) {
        return null;
    }
}

// Koordinaten auf Länge und Breite aufteilen oder ermitteln
async function holeGeodaten(parameter) {
    try {
      if (parameter && parameter!="LOKAL") {
        const geodaten = parameter.split(",").map(parseFloat)
        return { latitude: geodaten[0], longitude: geodaten[1] }
      } else {
        Location.setAccuracyToThreeKilometers()
        return await Location.current()
      }
    } catch(e) {
      return null;
    }
}
