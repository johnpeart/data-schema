---
caption: "Data schema"
title: "GPG 44"
---

## Data taxonomy

### 1. Authenticator type

### 2. Authenticator quality

### 3. Authenticator protecton

## Data model

<div class="govuk-tabs" data-module="govuk-tabs">
  <ul class="govuk-tabs__list">
	<li class="govuk-tabs__list-item govuk-tabs__list-item--selected">
	  <a class="govuk-tabs__tab" href="#data-model--table">
		Table
	  </a>
	</li>
	<li class="govuk-tabs__list-item">
	  <a class="govuk-tabs__tab" href="#data-model--json">
		JSON
	  </a>
	</li>
  </ul>
  <div class="govuk-tabs__panel" id="data-model--table">	
	
| element | sub-element | type |
|---------|-------------|------|
| authentication | | |
| | authenticator | authenticator |
| | authenticator_protection | simple | 

  </div>
  <div class="govuk-tabs__panel govuk-tabs__panel--hidden" id="data-model--json">
		<pre>
			<code>
{
	"authentication": {
		"authenticator": {
			"type": "authenticator"
		},
		"authenticator_protection": {
			"type": "simple"
		}
	}
}
			</code>
		</pre>
  </div>
</div>


## Data dictionary

### Predefined list

### Predefined values