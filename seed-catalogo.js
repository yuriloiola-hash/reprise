const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CATALOGO = [
  {
    molecula: "Lyberdia",
    familia: null,
    marcas: [
      { nome: "Lind", laboratorio: "Eurof" },
      { nome: "Juneve", laboratorio: "Takeda" },
      { nome: "Lisdexanfetamina", laboratorio: "Gen" },
      { nome: "Lisdev", laboratorio: "Eurof" },
      { nome: "Venvanse", laboratorio: "Takeda" },
      { nome: "Lisvenx", laboratorio: "TNT" },
      { nome: "Lidexor", laboratorio: "BRP" },
      { nome: "Lyberdia", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Patz",
    familia: null,
    marcas: [
      { nome: "Zolpaz", laboratorio: "UniãoQ" },
      { nome: "Turno XR", laboratorio: "Eurof" },
      { nome: "Turno SL", laboratorio: "Eurof" },
      { nome: "Turno", laboratorio: "Eurof" },
      { nome: "Nuit Flash", laboratorio: "BS2" },
      { nome: "Hero", laboratorio: "SRX" },
      { nome: "Zoup SL", laboratorio: "SRX" },
      { nome: "Patz", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Patz CP",
    familia: null,
    marcas: [
      { nome: "Ezonia", laboratorio: "Eurof" },
      { nome: "Prysma", laboratorio: "Eurof" },
      { nome: "Zolfest", laboratorio: "Ache" },
      { nome: "Zolpidem", laboratorio: "Gen" },
      { nome: "Noctiden", laboratorio: "BS2" },
      { nome: "Riposo SL", laboratorio: "Eurof" },
      { nome: "Isoy", laboratorio: "FQM" },
      { nome: "Stilnox", laboratorio: "SA" },
      { nome: "Patz CP", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Patz GTS",
    familia: null,
    marcas: [
      { nome: "Zolfest", laboratorio: "Ache" },
      { nome: "Patz GTS", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Cymbi",
    familia: null,
    marcas: [
      { nome: "Sympta", laboratorio: "Eurof" },
      { nome: "Duloxetina", laboratorio: "Gen" },
      { nome: "Dual", laboratorio: "Ache" },
      { nome: "Leduo", laboratorio: "UniãoQ" },
      { nome: "Velija", laboratorio: "Lib" },
      { nome: "Abretia", laboratorio: "FQM" },
      { nome: "Deprasil", laboratorio: "CT6" },
      { nome: "Duxxen", laboratorio: "MQF" },
      { nome: "DEP", laboratorio: "Eurof" },
      { nome: "Cymbi", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Konduz",
    familia: null,
    marcas: [
      { nome: "Mobale", laboratorio: "Eurof" },
      { nome: "Lyrica", laboratorio: "VTR" },
      { nome: "Prebictal", laboratorio: "Adm" },
      { nome: "Glya", laboratorio: "CT6" },
      { nome: "Dorene Tabs", laboratorio: "Ache" },
      { nome: "Dorene", laboratorio: "Ache" },
      { nome: "Limiar", laboratorio: "Eurof" },
      { nome: "Insit", laboratorio: "APS" },
      { nome: "Prefiss", laboratorio: "FQM" },
      { nome: "Infoc", laboratorio: "Ache" },
      { nome: "Jolik", laboratorio: "Lib" },
      { nome: "Konduz", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Condres Longbio",
    familia: null,
    marcas: [
      { nome: "Motore", laboratorio: "Ache" },
      { nome: "Curc", laboratorio: "MQF" },
      { nome: "Colflex", laboratorio: "MQF" },
      { nome: "Condres Longbio", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Condres Ultra",
    familia: null,
    marcas: [
      { nome: "Artrogen Duo", laboratorio: "Ache" },
      { nome: "Protena Plus D", laboratorio: "Ache" },
      { nome: "Condres Ultra", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Somalgin Cardio",
    familia: null,
    marcas: [
      { nome: "Aspirina Prevent", laboratorio: "MLB" },
      { nome: "AAS Protext", laboratorio: "MQF" },
      { nome: "AAS", laboratorio: "Gen" },
      { nome: "Ecasil 81", laboratorio: "BS2" },
      { nome: "Saliprev", laboratorio: "Eurof" },
      { nome: "Somalgin Cardio", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Vynaxa 2,5mg",
    familia: "Vynaxa",
    marcas: [
      { nome: "Xarelto", laboratorio: "MLB" },
      { nome: "Xafac", laboratorio: "APS" },
      { nome: "Vynaxa 2,5mg", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Vynaxa 10mg",
    familia: "Vynaxa",
    marcas: [
      { nome: "Rivaroxabana", laboratorio: "Gen" },
      { nome: "Rivaxa", laboratorio: "Eurof" },
      { nome: "Xarelto", laboratorio: "MLB" },
      { nome: "Vynaxa 10mg", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Vynaxa 15mg",
    familia: "Vynaxa",
    marcas: [
      { nome: "Xarelto", laboratorio: "MLB" },
      { nome: "Vynaxa 15mg", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Vynaxa 20mg",
    familia: "Vynaxa",
    marcas: [
      { nome: "Rivaxa", laboratorio: "Eurof" },
      { nome: "Rivaroxabana", laboratorio: "Gen" },
      { nome: "Vabam", laboratorio: "MQF" },
      { nome: "Vynaxa 20mg", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Brasart",
    familia: "Brasart",
    marcas: [
      { nome: "Diovan", laboratorio: "FQM" },
      { nome: "Valsartana", laboratorio: "Gen" },
      { nome: "Brasart", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Brasart HCT",
    familia: "Brasart",
    marcas: [
      { nome: "Diovan HCT", laboratorio: "FQM" },
      { nome: "Bravan HCT", laboratorio: "Ache" },
      { nome: "Exforge HCT", laboratorio: "FQM" },
      { nome: "Brasart HCT", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
  {
    molecula: "Brasart BCC",
    familia: "Brasart",
    marcas: [
      { nome: "Bravan Duo", laboratorio: "Ache" },
      { nome: "Brasart BCC", laboratorio: "EMS", ehMinhasMarca: true },
    ]
  },
];

async function seed() {
  for (const c of CATALOGO) {
    const { data: mol, error: err1 } = await supabase.from('catalogo_moleculas').upsert({ nome: c.molecula, familia: c.familia }).select().single();
    if (err1) { console.error(err1); continue; }
    
    for (const m of c.marcas) {
      const { error: err2 } = await supabase.from('catalogo_marcas').upsert({
        molecula_id: mol.id,
        nome: m.nome,
        laboratorio: m.laboratorio,
        eh_minhas_marca: !!m.ehMinhasMarca
      });
      if (err2) console.error(err2);
    }
  }
  console.log("Seeded successfully");
}
seed();
