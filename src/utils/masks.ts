export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove everything that is not a digit
    .replace(/(\d{3})(\d)/, "$1.$2") // Add a dot between the 3rd and 4th digits
    .replace(/(\d{3})(\d)/, "$1.$2") // Add a dot between the 6th and 7th digits
    .replace(/(\d{3})(\d{1,2})/, "$1-$2") // Add a dash between the 9th and 10th digits
    .replace(/(-\d{2})\d+?$/, "$1"); // Prevent typing more than 11 digits
};

export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};
