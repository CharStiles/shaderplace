/**
 * YEvent describes the changes on a YType.
 */
export class YEvent {
    /**
     * @param {AbstractType<any>} target The changed type.
     * @param {Transaction} transaction
     */
    constructor(target: AbstractType<any>, transaction: Transaction);
    /**
     * The type on which this event was created on.
     * @type {AbstractType<any>}
     */
    target: AbstractType<any>;
    /**
     * The current target on which the observe callback is called.
     * @type {AbstractType<any>}
     */
    currentTarget: AbstractType<any>;
    /**
     * The transaction that triggered this event.
     * @type {Transaction}
     */
    transaction: Transaction;
    /**
     * @type {Object|null}
     */
    _changes: Object | null;
    /**
     * Computes the path from `y` to the changed type.
     *
     * @todo v14 should standardize on path: Array<{parent, index}> because that is easier to work with.
     *
     * The following property holds:
     * @example
     *   let type = y
     *   event.path.forEach(dir => {
     *     type = type.get(dir)
     *   })
     *   type === event.target // => true
     */
    get path(): (string | number)[];
    /**
     * Check if a struct is deleted by this event.
     *
     * In contrast to change.deleted, this method also returns true if the struct was added and then deleted.
     *
     * @param {AbstractStruct} struct
     * @return {boolean}
     */
    deletes(struct: AbstractStruct): boolean;
    /**
     * Check if a struct is added by this event.
     *
     * In contrast to change.deleted, this method also returns true if the struct was added and then deleted.
     *
     * @param {AbstractStruct} struct
     * @return {boolean}
     */
    adds(struct: AbstractStruct): boolean;
    /**
     * @return {{added:Set<Item>,deleted:Set<Item>,keys:Map<string,{action:'add'|'update'|'delete',oldValue:any}>,delta:Array<{insert:Array<any>}|{delete:number}|{retain:number}>}}
     */
    get changes(): {
        added: Set<Item>;
        deleted: Set<Item>;
        keys: Map<string, {
            action: 'add' | 'update' | 'delete';
            oldValue: any;
        }>;
        delta: Array<{
            insert: Array<any>;
        } | {
            delete: number;
        } | {
            retain: number;
        }>;
    };
}
import { AbstractType } from "../types/AbstractType.js";
import { Transaction } from "./Transaction.js";
import { AbstractStruct } from "../structs/AbstractStruct.js";
import { Item } from "../structs/Item.js";
