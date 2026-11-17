import { mk, Seg } from "./types";
import { intro, induction, deepening, deepRest, emergence, sleepDrift } from "./common";
import type { SessionId } from "../sessions";

const d = mk("deep");

const relaxation: Seg[] = [
  d("Now, in this deep, quiet place, imagine a warm, golden light resting just above your head.", 5),
  d("With each breath, this light flows down through you, dissolving tension wherever it finds it.", 7),
  d("It moves through your head, your shoulders, your arms, your chest… leaving behind a soft, glowing calm.", 8, 2),
  d("Picture yourself somewhere beautiful and safe. Perhaps a quiet shore at dusk, or a meadow in warm evening light.", 7),
  d("Notice the colours. Hear the gentle sounds. Feel the air, soft and easy against your skin.", 8, 2),
  d("This is your place. It is always here, waiting, whenever you choose to return.", 8),
  d("Every muscle in your body is loose and heavy. Every thought is slow and soft.", 9, 3),
  d("Your mind knows exactly how to rest. And your body remembers how to heal, and restore, and be at peace.", 10, 3),
  d("Silently, tell yourself: I am calm. I am safe. I am at ease.", 9),
  d("Let those words sink in, becoming true in every part of you.", 12, 2),
  d("You can return to this stillness any time, simply by taking a slow breath and softening your shoulders.", 10),
  d("For a few moments, simply rest here, in this quiet. Nothing to do. Nothing to fix.", 18, 3),
];

const stress: Seg[] = [
  d("Now, in this calm place, notice any stress you've been carrying. Just notice, without judging it.", 6),
  d("Imagine that stress as a colour, a shape, or a weight held somewhere in your body.", 7),
  d("With your next breath out, begin to let it loosen. It doesn't need to be forced. It simply softens.", 8, 2),
  d("Imagine it lifting away from you, like a heavy backpack slipping from your shoulders onto the ground.", 8),
  d("You are lighter now. Your shoulders drop. Your jaw is loose. Your breathing is slow and free.", 8),
  d("Picture a place where you feel completely safe. Perhaps a forest path, dappled with light, or a quiet room with rain at the window.", 8, 2),
  d("Notice how easy it is to breathe here. How steady your heart feels. How quiet your mind has become.", 9, 2),
  d("Most of what we worry about is not happening right now. Right now, in this moment, you are safe.", 9),
  d("Imagine the problems of your day as small boats on a calm lake, drifting slowly towards the horizon.", 8, 3),
  d("You can deal with each of them in time, with a clear mind, one step at a time. Right now they can wait.", 10, 3),
  d("Silently repeat: I let go. I breathe. I am calm, and I can handle what comes.", 9),
  d("From now on, whenever stress arises, you will notice it early, take a slow breath out, and soften your shoulders.", 9, 2),
  d("Your body responds by relaxing. Your mind responds by clearing. This becomes easier each time.", 10, 3),
  d("Rest here in this deep calm for a few moments more.", 18, 3),
];

const confidence: Seg[] = [
  d("In this deep, receptive state, your mind is open to positive change. What you hear here sinks in easily.", 6),
  d("Think of a time you felt capable and strong. A moment you were proud of yourself. Let it come alive.", 8),
  d("See what you saw. Hear what you heard. Feel the steadiness in your body, the warmth in your chest.", 9, 2),
  d("That confidence has always been inside you. Now it grows stronger with every breath.", 8),
  d("Imagine a glowing golden sphere at the centre of your chest. With every breath it grows brighter and warmer.", 8),
  d("It fills your chest… your shoulders… your arms… your whole body, until you are radiating quiet strength.", 9, 2),
  d("Now picture a situation where you want to feel more confident. See yourself walking in, standing tall, relaxed.", 8),
  d("Your breathing is calm. Your voice is clear and steady. People respond to you warmly.", 9, 2),
  d("If a doubt appears, you simply notice it, breathe out, and return to your golden centre.", 8, 3),
  d("See yourself speaking, acting, and handling things with ease. This is the real you, capable and calm.", 9, 3),
  d("Every day, you grow more confident. Your self-belief becomes natural, steady, and unshakable.", 9),
  d("You are worthy. You are capable. You trust yourself to handle whatever comes.", 9),
  d("And whenever you need it, you can press your thumb and finger together, take a breath, and feel this golden confidence return.", 10, 2),
  d("Let these suggestions settle deeply into your mind, becoming part of who you are.", 16, 3),
];

const habits: Seg[] = [
  d("In this deeply relaxed state, your mind is open and flexible. Old patterns are loosening, and new ones can take root.", 7),
  d("Think of the habit you'd like to change. Notice it without judgment. It has simply been a pattern your mind learned.", 8),
  d("And anything learned can be unlearned, and replaced with something that serves you better.", 8, 2),
  d("Picture the moment just before the habit begins, the cue or the feeling that sets it off. See it clearly.", 8),
  d("Now see a pause appear in that moment. A small, calm space. In that space, you breathe, and you choose.", 9, 2),
  d("Imagine the urge as a wave. It rises, peaks, and softens, and you ride it, calm and steady, until it passes.", 9),
  d("Each time you let it pass without acting, the pattern grows weaker, and you grow stronger.", 9, 2),
  d("Now see yourself doing something different in that moment. Something that nourishes you. Something you feel good about.", 9),
  d("Notice how proud you feel. How free. How much lighter your body feels, as though a weight has lifted.", 9, 3),
  d("Mentally rehearse it once more. The cue appears. You pause. You breathe. And you choose your new response, easily.", 10, 3),
  d("With each day, this becomes more natural, more automatic, and more your own.", 9),
  d("You are in charge of your choices. You are free to change. And you are changing, right now.", 10),
  d("Let these new patterns settle deeply, becoming part of how you live.", 16, 3),
];

const alcohol: Seg[] = [
  d("In this deep, calm state, your mind is open and willing. You are here because you care about your wellbeing, and that matters.", 7),
  d("Take a moment to think about why you want change. Perhaps your health, your sleep, your relationships, or your self-respect.", 9),
  d("Feel how strongly that reason matters to you. Let it become a quiet, steady strength in your chest.", 9, 2),
  d("Now remember that a craving is just a wave. It rises, it peaks, and it always passes, usually within minutes.", 9),
  d("Imagine standing on a quiet beach, watching a wave swell and roll in. You don't fight it. You simply watch, and breathe.", 9),
  d("The wave rises… reaches its peak… and gently falls away. And you are still here, calm, steady, and in control.", 10, 2),
  d("Each craving you let pass makes the next one weaker. You are teaching your mind a new way.", 9),
  d("Now picture a moment when you might normally reach for a drink. Perhaps after work, or at a gathering with friends.", 8, 2),
  d("See yourself pause. Take one slow breath. Feel your feet on the ground. You are calm and clear.", 9, 2),
  d("See yourself choosing something else. A glass of sparkling water, a walk outside, a call to a friend.", 9),
  d("Notice how good it feels to keep that promise to yourself. Proud. Clear-headed. Free.", 9, 3),
  d("Imagine waking tomorrow morning rested, with a clear head, bright energy, and quiet pride.", 9, 3),
  d("You are not giving anything up. You are gaining your clarity, your health, and your freedom.", 10),
  d("Each day, alcohol matters less, and your calm, steady self matters more. You choose, and you are free.", 10),
  d("If you ever slip, you meet it with kindness, learn from it, and simply begin again. You are not defined by one moment.", 10, 3),
  d("Let these words sink in deeply, supporting you in every decision you make.", 16, 3),
];

const sleep: Seg[] = [
  d("Now you can let go of the day completely. Whatever happened, it is finished, and you don't need to think about it anymore.", 8),
  d("Imagine your body growing heavier, sinking into the softness beneath you, as though made of warm sand.", 9),
  d("Picture a quiet night sky above you, deep blue, full of soft and gentle stars.", 9, 2),
  d("With every breath, you drift a little deeper, like a leaf floating on a slow, calm river.", 10),
  d("Any thoughts that come are like clouds passing the moon. You don't follow them. You let them drift by.", 10, 2),
  d("Your eyelids are heavy. Your arms and legs are heavy. Your whole body is warm, still, and ready for rest.", 10),
  d("Imagine a soft, silver mist rolling gently over you, soothing and cool, carrying you towards sleep.", 10, 3),
  d("Sleep comes naturally to you. Your body knows how. Your mind knows how. You trust it completely.", 10),
  d("Each night, you fall asleep more easily, and sleep more deeply, and wake feeling restored.", 12, 2),
  d("Breathing slowly now. In… and out. Each breath carrying you a little further down.", 14, 3),
];

const BODY: Record<SessionId, Seg[]> = { relaxation, stress, confidence, habits, alcohol, sleep };

export function buildScript(id: SessionId, minutes: number): Seg[] {
  const tier = minutes >= 20 ? 4 : minutes >= 15 ? 3 : minutes >= 10 ? 2 : 1;
  const all = [...intro(), ...induction(), ...deepening(), ...BODY[id], ...deepRest(), ...(id === "sleep" ? sleepDrift() : emergence())];
  return all.filter((s) => s.tier <= tier);
}
