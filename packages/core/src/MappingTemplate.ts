import { Assign } from "@aws-cdk/aws-appsync";

class TemplateHeaderAttributeValuesStep {
  constructor(
    private readonly attr: string,
    private readonly container: string,
    private readonly assignments: Assign[]
  ) {}

  public is(val: string): TemplateHeaderAttributeValues {
    this.assignments.push(new Assign(this.attr, val));
    return new TemplateHeaderAttributeValues(this.container, this.assignments);
  }
}

class TemplateHeaderAttributeValues {
  constructor(
    private readonly container: string,
    private readonly assignments: Assign[] = [],
    private readonly vtlVarName: string = "extra"
  ) {}
  public attribute(attr: string) {
    return new TemplateHeaderAttributeValuesStep(
      attr,
      this.container,
      this.assignments
    );
  }

  public renderTemplate(): string {
    return ` 
    #set($${this.vtlVarName} = ${this.container})
    ${this.assignments.map((a) => a.putInMap(this.vtlVarName)).join("\n")}
    `;
  }
}

export class TemplateHeader {
  public static attribute(attr: string): TemplateHeaderAttributeValuesStep {
    return new TemplateHeaderAttributeValues("{}").attribute(attr);
  }
}
