import { DEFAULT_SETTINGS, readSettings, writeSetting } from './settings';

describe('settings', () => {
  it('reads nothing as the defaults: five days, vibration on, lights on, the tabby cat', () => {
    expect(readSettings({})).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS).toEqual({
      meditationGoal: 5,
      meditationVibrate: true,
      lightsOff: false,
      cat: 'tabby',
    });
  });

  it('reads back what it wrote', () => {
    const stored = {
      meditationGoal: writeSetting('meditationGoal', 3),
      meditationVibrate: writeSetting('meditationVibrate', false),
      lightsOff: writeSetting('lightsOff', true),
      cat: writeSetting('cat', 'siamese'),
    };
    expect(readSettings(stored)).toEqual({
      meditationGoal: 3,
      meditationVibrate: false,
      lightsOff: true,
      cat: 'siamese',
    });
    expect(readSettings({ cat: writeSetting('cat', 'none') }).cat).toBe('none');
  });

  it('keeps the default for anything unreadable, and keeps the goal within its bounds', () => {
    expect(readSettings({ meditationGoal: 'soon', lightsOff: 'maybe', cat: 'dog' })).toEqual(
      DEFAULT_SETTINGS,
    );
    expect(readSettings({ meditationGoal: '12' }).meditationGoal).toBe(7);
    expect(writeSetting('meditationGoal', 0)).toBe('1');
  });
});
