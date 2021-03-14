export class StructStore {
    /**
     * @type {Map<number,Array<GC|Item>>}
     */
    clients: Map<number, Array<GC | Item>>;
    /**
     * Store incompleted struct reads here
     * `i` denotes to the next read operation
     * We could shift the array of refs instead, but shift is incredible
     * slow in Chrome for arrays with more than 100k elements
     * @see tryResumePendingStructRefs
     * @type {Map<number,{i:number,refs:Array<GC|Item>}>}
     */
    pendingClientsStructRefs: Map<number, {
        i: number;
        refs: Array<GC | Item>;
    }>;
    /**
     * Stack of pending structs waiting for struct dependencies
     * Maximum length of stack is structReaders.size
     * @type {Array<GC|Item>}
     */
    pendingStack: Array<GC | Item>;
    /**
     * @type {Array<DSDecoderV2>}
     */
    pendingDeleteReaders: Array<DSDecoderV2>;
}
export function getStateVector(store: StructStore): Map<number, number>;
export function getState(store: StructStore, client: number): number;
export function integretyCheck(store: StructStore): void;
export function addStruct(store: StructStore, struct: GC | Item): void;
export function findIndexSS(structs: Array<Item | GC>, clock: number): number;
export function find(store: StructStore, id: ID): GC | Item;
/**
 * Expects that id is actually in store. This function throws or is an infinite loop otherwise.
 * @private
 * @function
 */
export const getItem: (arg0: StructStore, arg1: ID) => Item;
export function findIndexCleanStart(transaction: Transaction, structs: Array<Item | GC>, clock: number): number;
export function getItemCleanStart(transaction: Transaction, id: ID): Item;
export function getItemCleanEnd(transaction: Transaction, store: StructStore, id: ID): Item;
export function replaceStruct(store: StructStore, struct: GC | Item, newStruct: GC | Item): void;
export function iterateStructs(transaction: Transaction, structs: Array<Item | GC>, clockStart: number, len: number, f: (arg0: GC | Item) => void): void;
import { GC } from "../structs/GC.js";
import { Item } from "../structs/Item.js";
import { DSDecoderV2 } from "./UpdateDecoder.js";
import { ID } from "./ID.js";
import { Transaction } from "./Transaction.js";
