/**
 * Turkish Font Support for jsPDF
 * Embeds Roboto font with full Turkish character support (İ, ı, Ş, ş, Ğ, ğ, Ü, ü, Ö, ö, Ç, ç)
 * 
 * Font files are real, production-ready base64-encoded Roboto fonts (~70KB each)
 * Font names: "Roboto" with styles "normal" and "bold"
 */

import { jsPDF } from 'jspdf';
import { callAddFont as addRobotoRegular } from '../assets/fonts/roboto-regular-normal';
import { callAddFont as addRobotoBold } from '../assets/fonts/roboto-bold-bold';

/**
 * Register Turkish-compatible fonts with jsPDF document
 * Uses embedded Roboto font with full Unicode support
 */
export function addTurkishFonts(doc: jsPDF): void {
  // Register both fonts
  addRobotoRegular.call(doc);
  addRobotoBold.call(doc);
  
  // Set Roboto as default font
  doc.setFont('Roboto', 'normal');
  console.log('✓ Roboto fonts registered (normal + bold) with Turkish character support');
}

/**
 * Configure font for bold text
 */
export function setFontBold(doc: jsPDF): void {
  doc.setFont('Roboto', 'bold');
}

/**
 * Configure font for normal text
 */
export function setFontNormal(doc: jsPDF): void {
  doc.setFont('Roboto', 'normal');
}

