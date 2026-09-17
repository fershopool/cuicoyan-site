import { environment } from '../config/environment.js';
export function getJoinChannel() { return environment.externalJoinUrl || ''; }
export function getContactChannel() { return environment.externalContactUrl || ''; }
