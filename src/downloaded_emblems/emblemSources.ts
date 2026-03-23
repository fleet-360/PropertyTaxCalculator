import type { StaticImageData } from "next/image";

import emblemAfula from "./העיר עפולה.png";
import emblemAkko from "./העיר עכו.png";
import emblemAshdod from "./העיר אשדוד.png";
import emblemAshkelon from "./העיר אשקלון.png";
import emblemAriel from "./העיר אריאל.png";
import emblemBeerSheva from "./העיר באר שבע.gif";
import emblemBeerYaakov from "./העיר באר יעקב.png";
import emblemBneiBrak from "./העיר בני ברק.png";
import emblemBeitShean from "./העיר בית שאן.png";
import emblemBatYam from "./העיר בת ים.png";
import emblemGivatayim from "./העיר גבעתיים.png";
import emblemHadera from "./העיר חדרה.png";
import emblemHerzliya from "./העיר הרצליה.png";
import emblemHolon from "./העיר חולון.png";
import emblemHaifa from "./העיר חיפה.png";
import emblemYavne from "./העיר יבנה.png";
import emblemYehudMonosson from "./העיר יהוד-מונוסון.png";
import emblemYokneam from "./העיר יקנעם עילית.png";
import emblemKfarSaba from "./העיר כפר סבא.png";
import emblemKarmiel from "./העיר כרמיאל.png";
import emblemNahariya from "./העיר נהריה.png";
import emblemNesZiona from "./העיר נס ציונה.png";
import emblemNesher from "./העיר נשר.png";
import emblemNetanya from "./העיר נתניה.png";
import emblemEilat from "./העיר אילת.png";
import emblemElad from "./העיר אלעד.png";
import emblemPetahTikva from "./העיר פתח תקווה.png";
import emblemSafed from "./העיר צפת.png";
import emblemKiryatAta from "./העיר קריית אתא.png";
import emblemKiryatBialik from "./העיר קריית ביאליק.png";
import emblemKiryatGat from "./העיר קריית גת.png";
import emblemKiryatMalachi from "./העיר קריית מלאכי.png";
import emblemKiryatMotzkin from "./העיר קריית מוצקין.png";
import emblemKiryatOno from "./העיר קריית אונו.png";
import emblemKiryatShmona from "./העיר קריית שמונה.png";
import emblemRoshHaayin from "./העיר ראש העין.png";
import emblemRishon from "./העיר ראשון לציון.png";
import emblemRehovot from "./העיר רחובות.png";
import emblemRamla from "./העיר רמלה.png";
import emblemRamatGan from "./העיר רמת גן.png";
import emblemRamatHasharon from "./העיר רמת השרון.png";
import emblemRaanana from "./העיר רעננה.png";
import emblemTelAviv from "./העיר תל אביב-יפו.png";

export type MunicipalityEmblem = {
  name: string;
  src: StaticImageData;
};

export const municipalityEmblems: MunicipalityEmblem[] = [
  { name: "עפולה", src: emblemAfula },
  { name: "עכו", src: emblemAkko },
  { name: "אשדוד", src: emblemAshdod },
  { name: "אשקלון", src: emblemAshkelon },
  { name: "אריאל", src: emblemAriel },
  { name: "באר שבע", src: emblemBeerSheva },
  { name: "באר יעקב", src: emblemBeerYaakov },
  { name: "בני ברק", src: emblemBneiBrak },
  { name: "בית שאן", src: emblemBeitShean },
  { name: "בת ים", src: emblemBatYam },
  { name: "גבעתיים", src: emblemGivatayim },
  { name: "חדרה", src: emblemHadera },
  { name: "הרצליה", src: emblemHerzliya },
  { name: "חולון", src: emblemHolon },
  { name: "חיפה", src: emblemHaifa },
  { name: "יבנה", src: emblemYavne },
  { name: "יהוד-מונוסון", src: emblemYehudMonosson },
  { name: "יקנעם עילית", src: emblemYokneam },
  { name: "כפר סבא", src: emblemKfarSaba },
  { name: "כרמיאל", src: emblemKarmiel },
  { name: "נהריה", src: emblemNahariya },
  { name: "נס ציונה", src: emblemNesZiona },
  { name: "נשר", src: emblemNesher },
  { name: "נתניה", src: emblemNetanya },
  { name: "אילת", src: emblemEilat },
  { name: "אלעד", src: emblemElad },
  { name: "פתח תקווה", src: emblemPetahTikva },
  { name: "צפת", src: emblemSafed },
  { name: "קריית אתא", src: emblemKiryatAta },
  { name: "קריית ביאליק", src: emblemKiryatBialik },
  { name: "קריית גת", src: emblemKiryatGat },
  { name: "קריית מלאכי", src: emblemKiryatMalachi },
  { name: "קריית מוצקין", src: emblemKiryatMotzkin },
  { name: "קריית אונו", src: emblemKiryatOno },
  { name: "קריית שמונה", src: emblemKiryatShmona },
  { name: "ראש העין", src: emblemRoshHaayin },
  { name: "ראשון לציון", src: emblemRishon },
  { name: "רחובות", src: emblemRehovot },
  { name: "רמלה", src: emblemRamla },
  { name: "רמת גן", src: emblemRamatGan },
  { name: "רמת השרון", src: emblemRamatHasharon },
  { name: "רעננה", src: emblemRaanana },
  { name: "תל אביב-יפו", src: emblemTelAviv },
];
