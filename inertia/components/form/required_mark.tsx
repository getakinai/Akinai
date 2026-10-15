/** Asterisk after a field label; the input itself carries `aria-required`. */
export default function RequiredMark() {
  return (
    <span className="ml-0.5 text-danger" aria-hidden="true">
      *
    </span>
  )
}
