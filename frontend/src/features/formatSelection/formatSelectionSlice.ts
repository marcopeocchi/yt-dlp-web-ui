import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface FormatSelectionState {
  bestFormat: string
  audioFormat: string
  videoFormat: string
}