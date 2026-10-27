import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Equipment from './models/Equipment.js';

const items = [
 {name:'Digital Oscilloscope',code:'LAB-EQ-001',category:'Electronics',location:'Electronics Lab · Bench 1',quantity:3,description:'Two-channel oscilloscope for observing and measuring electrical signals.',instructions:'Return probes and leads with the unit.'},
 {name:'Digital Multimeter',code:'LAB-EQ-002',category:'Measurement',location:'Electronics Lab · Cabinet A',quantity:8,description:'Digital meter for voltage, current, resistance and continuity measurements.'},
 {name:'Arduino Uno Kit',code:'LAB-EQ-003',category:'Electronics',location:'Embedded Systems Lab · Shelf 2',quantity:12,description:'Microcontroller board kit for prototyping and embedded programming.'},
 {name:'Bench Power Supply',code:'LAB-EQ-004',category:'Electronics',location:'Electronics Lab · Bench 3',quantity:4,description:'Adjustable regulated DC supply for circuit experiments.'},
 {name:'Digital Vernier Caliper',code:'LAB-EQ-005',category:'Measurement',location:'Workshop · Cabinet B',quantity:5,description:'Precision instrument for measuring internal and external dimensions.'},
 {name:'Optical Microscope',code:'LAB-EQ-006',category:'Optics',location:'Physics Lab · Table 4',quantity:2,description:'Compound microscope for observing prepared specimens.'},
 {name:'Engineering Workstation',code:'LAB-EQ-007',category:'Computer Equipment',location:'Computing Lab · Desk 12',quantity:6,description:'Workstation for simulation, CAD and engineering software.'},
 {name:'Soldering Station',code:'LAB-EQ-008',category:'Electronics',location:'Electronics Lab · Bench 5',quantity:4,status:'maintenance',description:'Temperature-controlled soldering station for electronics practicals.'},
 {name:'Safety Goggles Set',code:'LAB-EQ-009',category:'Safety',location:'Chemical Lab · Safety cabinet',quantity:20,description:'Protective eyewear required for lab activities where indicated.'}
];
try {
 await mongoose.connect(process.env.MONGODB_URI);
 for (const item of items) await Equipment.updateOne({code:item.code},{$setOnInsert:item},{upsert:true});
 console.log('Seed equipment added (existing codes were left unchanged).');
} catch (e) { console.error(e.message); process.exitCode=1; }
finally { await mongoose.disconnect(); }
