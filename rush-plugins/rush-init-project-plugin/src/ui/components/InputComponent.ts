import { BaseFieldComponent, IComponentOptions, IExtendedAnswers } from './BaseFieldComponent';
import blessed, { Widgets } from 'blessed';

import type { PromptQuestion } from 'node-plop';
import type { SyncHook } from 'tapable';
import { Answers } from 'inquirer';
import { COLORS } from '../COLOR';

export class InputComponent extends BaseFieldComponent {
  public label: Widgets.BoxElement;
  public input: Widgets.TextareaElement;
  public placeholder: Widgets.BoxElement;
  private _message: string = '';
  public constructor(
    form: Widgets.FormElement<Answers>,
    prompt: PromptQuestion,
    option: IComponentOptions,
    hookForPrompt: SyncHook<[PromptQuestion, Partial<IExtendedAnswers>], null | undefined> | undefined
  ) {
    super(form, prompt, option, hookForPrompt);
    this.label = blessed.box({
      tags: true,
      parent: this.form,
      height: 1,
      content: this.prompt.name,
      alwaysScroll: true,
      shrink: true
    });
    this.input = blessed.textarea({
      name: this.prompt.name,
      parent: this.form,
      inputOnFocus: true,
      height: 3,
      border: 'line',
      mouse: true,
      style: {
        focus: {
          border: {
            fg: COLORS.green5
          }
        }
      },
      alwaysScroll: true,
      shrink: true,
      width: '100%'
    });
    this.input.key(['return'], () => {
      // Workaround, since we can't stop the return from being added.
      this.input.emit('keypress', null, { name: 'backspace' });
      this.input.emit('keypress', '\x1b', { name: 'escape' });
      this.focusNext();
      return;
    });
    this.input.on('focus', () => {
      this.label.style.fg = COLORS.green5;
      this.form.screen.render();
    });
    this.input.on('blur', async () => {
      this.label.style.fg = COLORS.black;
      await this.validateResult();
      this.form.screen.render();
    });
    this.placeholder = blessed.box({
      tags: true,
      parent: this.form,
      height: 1,
      alwaysScroll: true,
      shrink: true,
      width: '100%'
    });
    this.elements.push(this.label, this.input, this.placeholder);
  }
  public focus(): void {
    this.input.focus();
  }
  public async validateResult(): Promise<void> {
    this.label.setContent(`${this._message} {${COLORS.blue4}-fg}[validating...]{/${COLORS.blue4}-fg}`);
    try {
      this.isValidate = await this.validate(this.input.value);
    } catch (error) {
      this.isValidate = ((error ?? 'error') as string).toString();
    }
    if (this.isValidate === true) {
      this.label.setContent(`${this._message}`);
      this.placeholder.setContent('');
    } else {
      const warningStr: string = this.isValidate ? this.isValidate : 'error';
      this.label.setContent(`{${COLORS.red6}-fg}*{/${COLORS.red6}-fg}${this._message}`);
      this.placeholder.setContent(` {${COLORS.red6}-fg}[${warningStr}]{/${COLORS.red6}-fg}`);
    }
  }

  public async setMessage(): Promise<void> {
    try {
      const message: string = await this.message();
      this._message = message;
      this.label.setContent(this._message);
    } catch (e) {
      this.form.screen.log(e);
    }
  }
  public async setDefaultValue(): Promise<void> {
    try {
      const defualtValue: string = await this.default();
      this.input.value = defualtValue;
    } catch (e) {
      this.form.screen.log(e);
    }
  }
}
