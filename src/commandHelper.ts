import isCidr from "is-cidr";

export function parseCidrs(cidr: string) {
        const cidrList = cidr.split(",");
        cidrList.forEach((singleCidr) => {
            const parsedCidr = isCidr(singleCidr);
            if (!parsedCidr) {
                throw new Error(`Invalid CIDR: ${singleCidr}`);
            }
        });
        return cidr;
}

export function parseMyInt(value: string) {
    const parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) {
        throw new Error(`Invalid integer: ${value}`);
    }
    return parsedValue;
}