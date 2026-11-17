import { mk, Seg } from "./types";

export function intro(): Seg[] {
  const s = mk("intro");
  return [
    s("Welcome. Settle into a comfortable position, where you can be fully supported and undisturbed.", 3),
    s("This time belongs to you. There is nothing to do, and nowhere else you need to be.", 3),
    s("Let your eyes rest softly on the light in front of you, or let them close, whichever feels easier.", 4),
    s("There is no right or wrong way to do this. Whatever you experience is exactly right for you.", 3, 2),
  ];
}

export function induction(): Seg[] {
  const s = mk("induction");
  return [
    s("Take a slow, deep breath in through your nose… and let it go, gently, through your mouth.", 7),
    s("Again. Breathe in… feeling your belly softly rise.", 5),
    s("And release… letting go of everything you no longer need to carry.", 7),
    s("Now let your breathing find its own easy rhythm. In… and out. In… and out.", 6, 2),
    s("Breathing in for a count of four. One, two, three, four.", 4, 2),
    s("And out, slowly, for six. Two, three, four, five, six.", 6, 2),
    s("With every breath out, you may notice yourself becoming a little heavier… a little calmer.", 6),
    s("Let your attention travel to your forehead. Allow the skin there to smooth and soften.", 5),
    s("Let that softness spread around your eyes… so the eyelids grow heavy, relaxed, and comfortable.", 6, 2),
    s("Your jaw loosens. Your tongue rests. Your face is completely at ease.", 5, 2),
    s("Now your neck and shoulders. Let them drop, as if a warm hand were gently pressing the tension away.", 6),
    s("That wave of relaxation flows down your arms… through your elbows, your wrists, into your fingertips.", 6, 2),
    s("Your chest softens. Your breathing becomes slow and effortless.", 5, 2),
    s("Your stomach, your lower back, your hips, all letting go, sinking into the support beneath you.", 6, 3),
    s("Down through your thighs, your knees, your calves… all the way to the tips of your toes.", 6),
    s("Your whole body is heavy, warm, and deeply relaxed. And you can allow that relaxation to deepen with every breath.", 7),
  ];
}

export function deepening(): Seg[] {
  const s = mk("deepening");
  return [
    s("Now imagine a gentle staircase in front of you, ten soft steps leading down into a place of perfect calm.", 4),
    s("With each step down, you will go twice as deep, twice as relaxed. Ten… the first step down.", 5, 2),
    s("Nine… deeper and softer. Eight… letting go even more.", 5, 2),
    s("Seven… sinking comfortably. Six… so peaceful.", 5, 3),
    s("Five… halfway there, drifting deeper with every breath. Four… three…", 6),
    s("Two… almost there. And one… arriving, now, in a place of complete stillness and calm.", 8),
    s("Here, your mind is quiet and open. Thoughts may drift by like clouds, and you simply let them pass.", 7),
    s("With every breath you take, you go deeper still… deeper… and deeper.", 8, 2),
  ];
}

export function emergence(): Seg[] {
  const s = mk("return");
  return [
    s("In a moment, it will be time to return. You will bring with you this calm, and everything good you have created here.", 5),
    s("I will count from one up to five. With each number, you become a little more awake and aware.", 4),
    s("One. Slowly beginning to return. Feeling your body, and the surface beneath you.", 4),
    s("Two. Energy flowing back into your arms and legs. Breathing a little deeper.", 4, 2),
    s("Three. Sounds around you becoming clearer. Feeling refreshed and calm.", 4),
    s("Four. Gently wiggling your fingers and toes. Almost ready to open your eyes.", 4, 2),
    s("And five. Eyes open, fully awake, alert, and feeling wonderful. Welcome back.", 3),
  ];
}

export function sleepDrift(): Seg[] {
  const s = mk("sleep");
  return [
    s("You don't need to return. Simply let yourself continue to drift, safe and warm, into natural sleep.", 8),
    s("There is nothing more to do. Nothing to solve. Nothing to remember.", 10),
    s("Your breath is slow. Your body is heavy. Your mind is soft and quiet.", 12),
    s("Sleep is coming, easily and naturally… as it always does… and you let it.", 14),
    s("Goodnight.", 20),
  ];
}

/** Extra quiet depth for 15 and 20 minute sessions. */
export function deepRest(): Seg[] {
  const s = mk("deep");
  return [
    s("Now simply rest here, and let each breath carry you deeper than the one before.", 10, 3),
    s("There is nothing to think about, nothing to do. Your mind is quiet, and it is enough to simply be.", 12, 3),
    s("Notice the gentle rise and fall of your breathing. Like the tide, slow and effortless.", 12, 3),
    s("Each time you breathe out, you sink a little further into comfort.", 12, 3),
    s("Any sounds you hear only help you to drift deeper, becoming part of the quiet.", 12, 3),
    s("Your body is heavy and warm. Your thoughts are soft and slow. Everything is as it should be.", 14, 3),
    s("Imagine you are floating gently on warm, still water, completely held, completely safe.", 14, 4),
    s("Deeper now. Each breath dissolving a little more tension, a little more doubt.", 14, 4),
    s("Notice the stillness at the very centre of you, a place that is always calm, no matter what happens around you.", 15, 4),
    s("You can come back to this stillness whenever you wish. It is always here.", 14, 4),
    s("Breathing in calm… breathing out tension. In… and out.", 14, 4),
    s("Rest here, in this quiet, for as long as you need.", 16, 4),
  ];
}
