import { Engine } from './game/engine';
import { UI } from './ui/ui';
import { runSplash } from './ui/splash';

const ui = new UI();
const engine = new Engine();
ui.bind(engine);
engine.init(ui.canvas, ui).then(() => {
  engine.toTitle();
  document.getElementById('app')!.dataset.ready = 'true';
  runSplash(() => {});
});
