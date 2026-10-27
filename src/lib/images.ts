// Curated community photography (Pexels CDN). Admins can override any of these
// per-record (events / articles / social posts) through the dashboard.
const U = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940`;

export const IMG = {
  hero: U(6238226), // bright loft coworking, people collaborating
  welcome: U(7652139), // colleagues around laptop
  coworkLounge: U(5428638), // young professionals collaborating
  coworkAlt: U(7550286), // meeting table
  bunkRoom: U(5137986), // modern dorm bunk beds
  bunkSocial: U(4907183), // high five in dorm
  bunkFriends: U(5158948), // friends socializing in dorm
  bunkTalk: U(4907197), // women talking on bunks
  privateRoom: U(7968273), // resting with camera
  studioCrew: U(19102538), // studio crew
  studioCamera: U(36287813), // film crew camera
  studioSet: U(8088379), // videographer on set
  clapper: U(8088386), // clapperboard
  director: U(3411420), // cameraman
  broadcast: U(14699461), // videographer adjusting
  gamingCouch: U(7776191), // gaming night
  gamingDuo: U(9069297), // two friends gaming
  gamingRedCouch: U(9071469), // gaming fun
  gamingCouple: U(9069273), // couple gaming
  gamingFaces: U(6759166), // funny faces gaming
  dinner: U(30208564), // friends dinner laughter
  dinnerWide: U(6210505), // four friends at table
  dinnerToast: U(30208571), // toast
  buffet: U(29284267), // buffet style
  movieNight: U(6552592), // projector movie night
  movieSofa: U(8885182), // retro movie night
  movieCozy: U(6789626), // projector couple
  kitchen: U(6481855), // cooking together
  kitchenPrep: U(4262007), // setting the table
  flatbread: U(5637912), // sharing flatbread
  vlogWoman: U(9413658), // ring light vlogging
  vlogMan: U(6333683), // man recording
  studioNotes: U(4793170), // woman creator with notebook
  tripod: U(7514823), // phone on tripod
  streamer: U(7514831), // woman streaming
  lahoreJuice: U(7221009), // sugarcane juice lahore
  lahoreVendor: U(12926321), // street vendor lahore
  lahoreStreet: U(7221011), // lahore street
  lahoreMarket: U(40409410), // market vendor
};

export const CREATORS = [
  { name: "Mahnoor", role: "YouTuber & storyteller", image: IMG.vlogWoman },
  { name: "Danish", role: "AI filmmaker in residence", image: IMG.vlogMan },
  { name: "Areeba", role: "Editor & motion designer", image: IMG.studioNotes },
  { name: "Hamza", role: "Podcaster & streamer", image: IMG.streamer },
];
