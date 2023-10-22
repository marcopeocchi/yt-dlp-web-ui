import { atom } from 'recoil'

export const downloadTemplateState = atom({
  key: 'downloadTemplateState',
  default: localStorage.getItem('lastDownloadTemplate') ?? '',
  effects: [
    ({ onSet }) => onSet(e => localStorage.setItem('lastDownloadTemplate', e))
  ]
})

export const filenameTemplateState = atom({
  key: 'filenameTemplateState',
  default: localStorage.getItem('lastFilenameTemplate') ?? '',
  effects: [
    ({ onSet }) => onSet(e => localStorage.setItem('lastFilenameTemplate', e))
  ]
})