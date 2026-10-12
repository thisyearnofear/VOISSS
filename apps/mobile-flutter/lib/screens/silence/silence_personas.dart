/// Blind personas for entries — deterministic per entry id, so the same
/// take always gets the same stage name until the voter reveals it.
const _adjectives = [
  'Velvet',
  'Thundering',
  'Midnight',
  'Golden',
  'Whispering',
  'Brassy',
  'Smoky',
  'Electric',
  'Honeyed',
  'Gravel-voiced',
];

const _nouns = [
  'Megaphone',
  'Usher',
  'Narrator',
  'Crooner',
  'Projectionist',
  'Town Crier',
  'Ghost',
  'Maestro',
  'Siren',
  'Baritone',
];

String personaFor(int entryId) {
  final a = _adjectives[entryId % _adjectives.length];
  final n = _nouns[(entryId ~/ _adjectives.length) % _nouns.length];
  return '$a $n';
}
