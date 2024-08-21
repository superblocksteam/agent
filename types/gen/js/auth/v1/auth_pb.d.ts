// package: auth.v1
// file: auth/v1/auth.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class Claims extends jspb.Message { 
    getUserEmail(): string;
    setUserEmail(value: string): Claims;
    getOrgId(): string;
    setOrgId(value: string): Claims;
    getOrgType(): string;
    setOrgType(value: string): Claims;
    getRbacRole(): string;
    setRbacRole(value: string): Claims;
    clearRbacGroupsList(): void;
    getRbacGroupsList(): Array<string>;
    setRbacGroupsList(value: Array<string>): Claims;
    addRbacGroups(value: string, index?: number): string;
    getUserType(): string;
    setUserType(value: string): Claims;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Claims.AsObject;
    static toObject(includeInstance: boolean, msg: Claims): Claims.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Claims, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Claims;
    static deserializeBinaryFromReader(message: Claims, reader: jspb.BinaryReader): Claims;
}

export namespace Claims {
    export type AsObject = {
        userEmail: string,
        orgId: string,
        orgType: string,
        rbacRole: string,
        rbacGroupsList: Array<string>,
        userType: string,
    }
}
