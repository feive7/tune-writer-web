const inputBox = document.getElementById("input-box");
const outputBox = document.getElementById("output-box");
const { Renderer, Stave, StaveNote, BarNote, Voice, Formatter, Accidental } = Vex.Flow;
const renderer = new Renderer(outputBox, Renderer.Backends.SVG);
renderer.resize(outputBox.clientWidth, 500);
const context = renderer.getContext();

function check(strInput) {
  const IsDurationSetter = /^[A-Z][#b]*\d\/.$/g.test(strInput);
  if(IsDurationSetter) { return "IsDurationSetter"; }
  const IsBeat = /^[A-Z][#b]*\d+\/?.?$/g.test(strInput);
  if(IsBeat) { return "IsBeat"; }
  const IsTimeSignature = /\d+\/\d/g.test(strInput);
  if(IsTimeSignature) { return "IsTimeSignature"; }
  const IsClef = /^treble$|^bass$/g.test(strInput);
  if(IsClef) { return "IsClef"; }
}
function get(strInput, what) {
  switch(what) {
    case('beats'): const GetBeats = /[A-Z][#b]*\d+/g; return strInput.match(GetBeats);
    case('beat'): const GetBeat = /^[A-Z][#b]*\d+/; return strInput.match(GetBeat)[0];
    case('note'): const GetNote = /[A-Z](?=[#b]*\d)/g; return strInput.match(GetNote)[0];
    case('accidental'): const GetAccidental = /(?<=[A-Z]).*(?=\d)/g; return strInput.match(GetAccidental)[0];
    case('octave'): const GetOctave = /(?<=[A-Z][#b]*)\d+/g; return strInput.match(GetOctave)[0];
    case('duration'): const GetDuration = /(?<=^[A-Z][#b]*\d+)$|(?<=^[A-Z][#b]*\d+\/)./g; const duration = strInput.match(GetDuration); return (duration.length ? duration[0] : false);
  }
}

function treble_to_bass(beat) {
    treble_notes = 'ABCDEFG';
    bass_notes =   'FGABCDE';
    octave_offset = [2,2,1,1,2,2,2];
    const note = get(beat, 'note');
    const treble_index = treble_notes.indexOf(note);
    const bass_note = bass_notes[treble_index];
    const full = bass_note + get(beat, 'accidental') + (parseInt(get(beat, 'octave')) + octave_offset[treble_index]);
    return full;
}
function get_note_from_beat(beat, duration = "q") {
  const note = new StaveNote({keys: [beat], duration: duration});
  if(/[#b]+/g.test(beat)) { note.addModifier(new Accidental(beat.match(/[#b]+/g)[0])) }
  return note;
}
function get_glyph_from_beat(beat) {
  switch(beat) {
    case(''): return false;
    case('|'): return new BarNote();
    default: throw("unknown glyph: '" + beat + "'"); return false;
  }
}
function update(tune = inputBox.value) {
    context.rect(0,0,outputBox.clientWidth,outputBox.clientHeight,{stroke: 'none', fill: 'white'});
    const notes = [];
    const stave = new Stave(10, 40, outputBox.clientWidth - 20);
    const beats = tune.split(" ");
    var duration = 4;
    beats.forEach((beat, i) => {
      switch(check(beat)) {
        case("IsDurationSetter"):
          console.log("Duration setter");
          duration = beat.slice(-1);
        case("IsBeat"):
          beat = get(beat, 'beat');
          if(stave.clef == "bass") { beat = treble_to_bass(beat) }
          formatted = beat.replace(/(^[A-Z][#b]*)(\d+$)/g, "$1/$2");
          notes.push(get_note_from_beat(formatted, duration));
          break;
        case("IsTimeSignature"):
          stave.addTimeSignature(beat);
          break;
        case("IsClef"):
          stave.addClef(beat);
          break;
        default:
          const glyph = get_glyph_from_beat(beat);
          if(glyph) notes.push(glyph);
      }
    });
    stave.setContext(context).draw();
    Formatter.FormatAndDraw(context, stave, notes);
    console.log(stave);
}
update();

function playback() {
    const tune = inputBox.value;
    const sampler = new Tone.Synth().toDestination();
    const now = Tone.now();
    const notes = get(tune, 'beats');
    var ticks = 0;
    notes.forEach(note => {
        const noteName = note;
        sampler.triggerAttackRelease(noteName, .1, now + ticks);
        ticks += .5;
    });
    Tone.getTransport().start();
}
